const ExportManager = {
    // Neutralisation des injections de formules sans altérer les espaces d'origine
    neutraliserFormuleTableur(valeur) {
        if (valeur === undefined || valeur === null) return '';

        const original = String(valeur);

        // On teste le premier caractère non-espace sans modifier la chaîne originale
        // La regex ^\s*[=+\-@] cherche : début de ligne (^), espaces optionnels (\s*), puis un signe sensible
        return /^\s*[=+\-@]/.test(original)
            ? `'${original}`
            : original;
    },

    /**
     * Structure les données calculées sous forme de tableau de clés lisibles pour l'exportation
     * OPTIMISATION : le dictionnaire de correspondance des en-têtes est calculé une seule fois en amont.
     */
    preparerDonneesPourExport(eleves, enTetesBruts, mapping) {
        const clesMappees = Object.values(mapping);

        // 1. Définition des clés de base fixes (identiques pour toutes les lignes)
        const clesDeBaseFixes = [
            'Rang', 'Nom de l\'élève', 'Score Global', 'Score Bourse',
            'Score Âge', 'Score RFR', 'Score Distance', 'Score Temps',
            'Statut Boursier', 'Âge', 'RFR d\'origine (€)', 'Distance (km)',
            'Temps de trajet (min)'
        ];

        // Registre global pour suivre et empêcher toute collision d'en-tête à l'export
        const clesUtiliseesGlobal = new Set(clesDeBaseFixes);

        // 2. Génération UNIQUE du dictionnaire de correspondance pour les en-têtes optionnels
        const correspondanceEnTetesExtra = [];

        enTetesBruts.forEach(header => {
            if (!clesMappees.includes(header)) {
                // Neutralisation de l'injection sur l'en-tête lui-même
                let headerSecurise = this.neutraliserFormuleTableur(header);

                // Résolution des collisions de noms de colonnes
                let compteur = 1;
                const headerDeBase = headerSecurise;
                while (clesUtiliseesGlobal.has(headerSecurise)) {
                    headerSecurise = `${headerDeBase} (${compteur})`;
                    compteur++;
                }

                // Enregistrement global du nom final attribué
                clesUtiliseesGlobal.add(headerSecurise);

                // Stockage de la correspondance pour la réutilisation sur les lignes
                correspondanceEnTetesExtra.push({
                    original: header,
                    exporte: headerSecurise
                });
            }
        });

        // 3. Transformation performante de chaque ligne d'élève
        return eleves.map(e => {
            // Création de l'objet d'exportation avec les données ordonnées et calculées
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

            // Restitution instantanée et sécurisée des colonnes optionnelles pré-calculées
            correspondanceEnTetesExtra.forEach(mappingExtra => {
                const valeurBrute = e.metadonnees_hors_mapping[mappingExtra.original] ?? '';
                rowObj[mappingExtra.exporte] = this.neutraliserFormuleTableur(valeurBrute);
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
     * Génère et déclenche le téléchargement d'un fichier CSV (Strictement tabulaire)
     * AJOUT DU PARAMÈTRE dateReference EN FIN DE SIGNATURE
     */
    exporterVersCSV(eleves, enTetesBruts, mapping) {
        const donneesFormatees = this.preparerDonneesPourExport(eleves, enTetesBruts, mapping);
        if (donneesFormatees.length === 0) return;

        const entetes = Object.keys(donneesFormatees[0]);
        const lignesCsv = [];

        // Fonction d'échappement globale préconisée par l'audit
        const echapperCsv = valeur => {
            const texte = String(valeur ?? '').replace(/"/g, '""');
            return `"${texte}"`;
        };

        // On applique l'échappement sur les en-têtes pour immuniser le CSV contre les caractères spéciaux
        lignesCsv.push(entetes.map(echapperCsv).join(';'));

        // Données élèves révisées avec la même fonction de traitement
        donneesFormatees.forEach(item => {
            const valeurs = entetes.map(entete => echapperCsv(item[entete]));
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