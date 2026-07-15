const ExportManager = {
    /**
     * Structure les données calculées sous forme de tableau de clés lisibles pour l'exportation
     */
    preparerDonneesPourExport(eleves) {
        return eleves.map(e => ({
            'Rang': e.rang,
            'Nom de l\'élève': e.nom_eleve,
            'Score Global': e.scoreGlobal.toFixed(2),
            'Score Bourse': e.scoreBourse.toFixed(2),
            'Score Âge': e.scoreAge.toFixed(2),
            'Score Distance': e.scoreDistance.toFixed(2),
            'Score Temps': e.scoreTemps.toFixed(2),
            'Statut Boursier': e.boursier,
            'Âge': `${e.age} ans`,
            'Distance (km)': e.distance_km,
            'Temps de trajet (min)': e.temps_trajet_min,
            'Situation particulière': e.situation_particuliere
        }));
    },

    /**
     * Génère et déclenche le téléchargement d'un fichier Excel avec feuille annexe d'audit
     */
    exporterVersExcel(eleves, coefficients) {
        if (!window.XLSX) {
            alert("Erreur : La bibliothèque SheetJS n'est pas disponible pour l'export.");
            return;
        }

        const donneesFormatees = this.preparerDonneesPourExport(eleves);

        const worksheet = window.XLSX.utils.json_to_sheet(donneesFormatees);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, "Classement Internat");

        // --- NOUVELLE FEUILLE DE MÉTADONNÉES / AUDIT ---
        const infosAudit = [
            { "Propriété": "Date et heure de génération", "Valeur": new Date().toLocaleString('fr-FR') },
            { "Propriété": "Coeff. Bourse (%)", "Valeur": coefficients.bourse },
            { "Propriété": "Coeff. Âge (%)", "Valeur": coefficients.age },
            { "Propriété": "Coeff. Distance (%)", "Valeur": coefficients.distance },
            { "Propriété": "Coeff. Temps Trajet (%)", "Valeur": coefficients.temps },
            { "Propriété": "Algorithme", "Valeur": "Scoring Normalisé Multicritère Internat Lycée Champollion" }
        ];
        const worksheetAudit = window.XLSX.utils.json_to_sheet(infosAudit);
        window.XLSX.utils.book_append_sheet(workbook, worksheetAudit, "Metadonnees_Audit");

        const maxProps = [{ wch: 6 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 8 }, { wch: 14 }, { wch: 20 }, { wch: 30 }];
        worksheet['!cols'] = maxProps;

        const nomFichier = `Classement_Internat_${Utils.getTimestampForFilename()}.xlsx`;
        window.XLSX.writeFile(workbook, nomFichier);
    },

    /**
     * Génère et déclenche le téléchargement d'un fichier CSV avec en-têtes d'audit préfixés
     */
    exporterVersCSV(eleves, coefficients) {
        const donneesFormatees = this.preparerDonneesPourExport(eleves);
        if (donneesFormatees.length === 0) return;

        const entetes = Object.keys(donneesFormatees[0]);
        const lignesCsv = [];

        // --- EN-TÊTES DE MÉTA-DONNÉES (TRAÇABILITÉ / AUDIT) ---
        lignesCsv.push(`# Généré le: ${new Date().toLocaleString('fr-FR')}`);
        lignesCsv.push(`# Coefficients de pondération : Bourse=${coefficients.bourse}% | Age=${coefficients.age}% | Distance=${coefficients.distance}% | Temps=${coefficients.temps}%`);
        lignesCsv.push(`#`); // Ligne vide de séparation technique

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