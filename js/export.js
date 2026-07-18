const ExportManager = {
    // Neutralisation des injections de formules
    neutraliserFormuleTableur(valeur) {
        if (valeur === undefined || valeur === null) return '';
        const str = String(valeur).trim();
        // Si la chaîne commence par =, +, -, ou @, on l'échappe avec une simple quote
        return /^[=+\-@]/.test(str) ? `'${str}` : str;
    },

    /**
     * Structure les données calculées sous forme de tableau de clés lisibles pour l'exportation
     */
    preparerDonneesPourExport(eleves, enTetesBruts, mapping) {
        const clesMappees = Object.values(mapping);

        return eleves.map(e => {
            // Création de l'objet d'exportation de base (données ordonnées et calculées)
            const rowObj = {
                'Rang': e.rang,
                'Nom de l\'élève': this.neutraliserFormuleTableur(e.nom_eleve),
                'Score Global': e.scoreGlobal.toFixed(2),
                'Score Bourse': e.scoreBourse.toFixed(2),
                'Score Âge': e.scoreAge.toFixed(2),
                'Score RFR': e.scoreRfr.toFixed(2),
                'Score Distance': e.scoreDistance.toFixed(2),
                'Score Temps': e.scoreTemps.toFixed(2),
                'Statut Boursier': e.boursier,
                'Âge': `${e.age} ans`,
                'RFR d\'origine (€)': e.rfr_parents,
                'Distance (km)': e.distance_km,
                'Temps de trajet (min)': e.temps_trajet_min
            };

            // Restitution transparente de toutes les colonnes optionnelles d'origine hors critères de calcul
            enTetesBruts.forEach(header => {
                if (!clesMappees.includes(header)) {
                    const headerSecurise = this.neutraliserFormuleTableur(header);
                    const brute = e.metadonnees_hors_mapping[header] ?? '';
                    rowObj[headerSecurise] = this.neutraliserFormuleTableur(brute);
                }
            });

            return rowObj;
        });
    },

    /**
     * Génère et déclenche le téléchargement d'un fichier Excel avec feuille annexe d'audit (métadonnées)
     * AJOUT DU PARAMÈTRE dateReference EN FIN DE SIGNATURE
     */
    exporterVersExcel(eleves, coefficients, enTetesBruts, mapping, dateReference) {
        if (!window.XLSX) {
            alert("Erreur : La bibliothèque SheetJS n'est pas disponible pour l'export.");
            return;
        }

        const donneesFormatees = this.preparerDonneesPourExport(eleves, enTetesBruts, mapping);

        const worksheet = window.XLSX.utils.json_to_sheet(donneesFormatees);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, "Classement Internat");

        // --- FEUILLE DE MÉTADONNÉES / AUDIT ADAPTÉE ---
        const infosAudit = [
            { "Propriété": "Date et heure de génération", "Valeur": new Date().toLocaleString('fr-FR') },
            // --- AJOUT DE LA TRACABILITÉ DYNAMIQUE DU CALCUL DE L'ÂGE ---
            { "Propriété": "Date de référence (Âge)", "Valeur": Utils.formatDateFr(dateReference) },
            { "Propriété": "Coeff. Bourse (%)", "Valeur": coefficients.bourse },
            { "Propriété": "Coeff. Âge (%)", "Valeur": coefficients.age },
            { "Propriété": "Coeff. RFR (%)", "Valeur": coefficients.rfr },
            { "Propriété": "Coeff. Distance (%)", "Valeur": coefficients.distance },
            { "Propriété": "Coeff. Temps Trajet (%)", "Valeur": coefficients.temps },
            { "Propriété": "Algorithme", "Valeur": "Scoring Normalisé Multicritère Internat Lycée Champollion (V2)" }
        ];
        const worksheetAudit = window.XLSX.utils.json_to_sheet(infosAudit);
        window.XLSX.utils.book_append_sheet(workbook, worksheetAudit, "Metadonnees_Audit");

        // Ajustement de la largeur des premières colonnes pour le confort de lecture
        const maxProps = [
            { wch: 6 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
            { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 8 },
            { wch: 16 }, { wch: 14 }, { wch: 20 }
        ];
        worksheet['!cols'] = maxProps;

        const nomFichier = `Classement_Internat_${Utils.getTimestampForFilename()}.xlsx`;
        window.XLSX.writeFile(workbook, nomFichier);
    },

    /**
     * Génère et déclenche le téléchargement d'un fichier CSV
     * AJOUT DU PARAMÈTRE dateReference EN FIN DE SIGNATURE
     */
    exporterVersCSV(eleves, coefficients, enTetesBruts, mapping, dateReference) {
        const donneesFormatees = this.preparerDonneesPourExport(eleves, enTetesBruts, mapping);
        if (donneesFormatees.length === 0) return;

        const entetes = Object.keys(donneesFormatees[0]);
        const lignesCsv = [];

        // --- EN-TÊTES DE MÉTA-DONNÉES (TRAÇABILITÉ / AUDIT) ---
        lignesCsv.push(`# Généré le: ${new Date().toLocaleString('fr-FR')}`);
        // --- AJOUT DE LA TRACABILITÉ DYNAMIQUE DANS LES COMMENTAIRES CSV ---
        lignesCsv.push(`# Date de référence pour le calcul d'âge: ${Utils.formatDateFr(dateReference)}`);
        lignesCsv.push(`# Coefficients : Bourse=${coefficients.bourse}% | Age=${coefficients.age}% | RFR=${coefficients.rfr}% | Distance=${coefficients.distance}% | Temps=${coefficients.temps}%`);
        lignesCsv.push(`#`);

        // En-têtes du tableau principal
        lignesCsv.push(entetes.join(';'));

        // Données élèves
        donneesFormatees.forEach(item => {
            const valeurs = entetes.map(entete => {
                let valeur = item[entete] === undefined ? '' : String(item[entete]);
                valeur = valeur.replace(/"/g, '""');
                return `"${valeur}"`;
            });
            lignesCsv.push(valeurs.join(';'));
        });

        const contenuCsv = lignesCsv.join('\n');

        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), contenuCsv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const lienAppel = document.createElement('a');
        lienAppel.href = url;
        lienAppel.setAttribute('download', `Classement_Internat_${Utils.getTimestampForFilename()}.csv`);
        document.body.appendChild(lienAppel);
        lienAppel.click();
        document.body.removeChild(lienAppel);
        URL.revokeObjectURL(url);
    }
};