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
     * Génère et déclenche le téléchargement d'un fichier Excel avec feuille d'audit complète
     */
    exporterVersExcel(eleves, appInstance) {
        if (!window.XLSX) {
            alert("Erreur : La bibliothèque SheetJS n'est pas disponible pour l'export.");
            return;
        }

        const {
            version,
            coefficients,
            enTetesFichier,
            mappingSelectionne,
            dateReference,
            fichierCharge,
            lignesBrutes,
            elevesValides,
            dossiersRejetes
        } = appInstance;

        const donneesFormatees = this.preparerDonneesPourExport(eleves, enTetesFichier, mappingSelectionne);

        const worksheet = window.XLSX.utils.json_to_sheet(donneesFormatees);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, "Classement Internat");

        // --- FORMALISATION DU MAPPING POUR L'AUDIT ---
        const detailMapping = Object.entries(mappingSelectionne)
            .map(([cle, headerFile]) => `${cle} ➔ "${headerFile}"`)
            .join(' | ');

        // --- FEUILLE DE MÉTADONNÉES / AUDIT ENRICHIE ---
        const infosAudit = [
            { "Propriété": "Version de l'application", "Valeur": `v${version}` },
            { "Propriété": "Nom du fichier source", "Valeur": fichierCharge ? fichierCharge.name : "N/A" },
            { "Propriété": "Date et heure d'exportation", "Valeur": new Date().toLocaleString('fr-FR') },
            { "Propriété": "Date de référence (Calcul Âge)", "Valeur": Utils.formatDateFr(dateReference) },

            // Métadonnées de volumétrie
            { "Propriété": "Lignes importées (Total)", "Valeur": lignesBrutes.length },
            { "Propriété": "Lignes acceptées (Valides)", "Valeur": elevesValides.length },
            { "Propriété": "Lignes rejetées (Anomalies)", "Valeur": dossiersRejetes.length },

            // Traçabilité des règles applicatives & mapping
            { "Propriété": "Mapping des colonnes", "Valeur": detailMapping },
            { "Propriété": "Coeff. Bourse (%)", "Valeur": coefficients.bourse },
            { "Propriété": "Coeff. Âge (%)", "Valeur": coefficients.age },
            { "Propriété": "Coeff. RFR (%)", "Valeur": coefficients.rfr },
            { "Propriété": "Coeff. Distance (%)", "Valeur": coefficients.distance },
            { "Propriété": "Coeff. Temps Trajet (%)", "Valeur": coefficients.temps },
            { "Propriété": "Règles / Limites de validation", "Valeur": "Âge [0-30 ans], RFR ≥ 0, Distance ≥ 0 km, Temps ≥ 0 min (entier), Somme coeffs = 100%" },
            { "Propriété": "Algorithme de calcul", "Valeur": "Scoring Normalisé Multicritère Internat Lycée Champollion (V2)" }
        ];

        const worksheetAudit = window.XLSX.utils.json_to_sheet(infosAudit);
        window.XLSX.utils.book_append_sheet(workbook, worksheetAudit, "Metadonnees_Audit");

        // Ajustement de la largeur des colonnes de la feuille d'audit
        worksheetAudit['!cols'] = [{ wch: 32 }, { wch: 80 }];

        // Formatage des colonnes de la feuille principale
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