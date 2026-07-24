const Scoring = {
    /**
     * Calcule les scores normalisés et globaux pour l'ensemble des élèves valides
     */
    calculerClassement(eleves, weights) {
        if (eleves.length === 0) return [];

        // Protection du moteur de calcul contre les corruptions        
        eleves.forEach((e, idx) => {
            const champsNumeriquesStricts = [
                e.age,
                e.distance_km,
                e.temps_trajet_min,
                e.rfr_parents
            ];

            // 1. Vérification des grandeurs physiques/financières (Nombres finis positifs ou nuls)
            const champsFinis = champsNumeriquesStricts.every(valeur => typeof valeur === 'number' && Number.isFinite(valeur));

            // 2. Vérification spécifique de l'échelon de bourse (-1 pour non-boursier, ou 0 à 6)
            const echelonValide = typeof e.echelonBourse === 'number' && Number.isInteger(e.echelonBourse) && e.echelonBourse >= -1 && e.echelonBourse <= 6;

            if (!champsFinis || !echelonValide) {
                const identifiant = e.nom_eleve || `Élève à l'index ${idx}`;
                throw new Error(`Données numériques invalides ou corrompues transmises au moteur de classement pour : "${identifiant}".`);
            }
        });

        // 1. Recherche des extremums pour la normalisation (Min/Max de l'échantillon) 
        let maxAge = -Infinity, minAge = Infinity;
        let maxDist = -Infinity, minDist = Infinity;
        let maxTemps = -Infinity, minTemps = Infinity;
        let maxRfr = -Infinity, minRfr = Infinity;

        eleves.forEach(e => {
            if (e.age > maxAge) maxAge = e.age;
            if (e.age < minAge) minAge = e.age;

            if (e.distance_km > maxDist) maxDist = e.distance_km;
            if (e.distance_km < minDist) minDist = e.distance_km;

            if (e.temps_trajet_min > maxTemps) maxTemps = e.temps_trajet_min;
            if (e.temps_trajet_min < minTemps) minTemps = e.temps_trajet_min;

            if (e.rfr_parents > maxRfr) maxRfr = e.rfr_parents;
            if (e.rfr_parents < minRfr) minRfr = e.rfr_parents;
        });

        const rangeAge = (maxAge - minAge) || 1;
        const rangeDist = (maxDist - minDist) || 1;
        const rangeTemps = (maxTemps - minTemps) || 1;
        const rangeRfr = (maxRfr - minRfr) || 1;

        // 2. Calcul des scores individuels et globaux (Bruts + Arrondis) 
        const resultatsCalculatifs = eleves.map(e => {
            let scoreNormBourse = 0;
            if (e.echelonBourse === 0) scoreNormBourse = 40;
            else if (e.echelonBourse > 0) scoreNormBourse = 40 + (e.echelonBourse * 10);

            const scoreNormAge = ((maxAge - e.age) / rangeAge) * 100;
            const scoreNormRfr = ((maxRfr - e.rfr_parents) / rangeRfr) * 100;
            const scoreNormDistance = ((e.distance_km - minDist) / rangeDist) * 100;
            const scoreNormTemps = ((e.temps_trajet_min - minTemps) / rangeTemps) * 100;

            const scoreGlobal = (
                (scoreNormBourse * (weights.bourse / 100)) +
                (scoreNormAge * (weights.age / 100)) +
                (scoreNormRfr * (weights.rfr / 100)) +
                (scoreNormDistance * (weights.distance / 100)) +
                (scoreNormTemps * (weights.temps / 100))
            );

            return {
                ...e,
                // Valeurs brutes de précision pour le tri algorithmique uniforme
                scoreBourseBrut: scoreNormBourse,
                scoreAgeBrut: scoreNormAge,
                scoreRfrBrut: scoreNormRfr,
                scoreDistanceBrut: scoreNormDistance,
                scoreTempsBrut: scoreNormTemps,
                scoreGlobalBrut: scoreGlobal,

                // Valeurs arrondies pour l'affichage visuel et la conformité cosmétique
                scoreBourse: Math.round(scoreNormBourse * 100) / 100,
                scoreAge: Math.round(scoreNormAge * 100) / 100,
                scoreRfr: Math.round(scoreNormRfr * 100) / 100,
                scoreDistance: Math.round(scoreNormDistance * 100) / 100,
                scoreTemps: Math.round(scoreNormTemps * 100) / 100,
                scoreGlobal: Math.round(scoreGlobal * 100) / 100
            };
        });

        // Scoring.js (Tri final dans calculerClassement)
        resultatsCalculatifs.sort((a, b) => {
            // 1 à 6. Scores bruts
            if (b.scoreGlobalBrut !== a.scoreGlobalBrut) return b.scoreGlobalBrut - a.scoreGlobalBrut;
            if (b.scoreBourseBrut !== a.scoreBourseBrut) return b.scoreBourseBrut - a.scoreBourseBrut;
            if (b.scoreAgeBrut !== a.scoreAgeBrut) return b.scoreAgeBrut - a.scoreAgeBrut;
            if (b.scoreRfrBrut !== a.scoreRfrBrut) return b.scoreRfrBrut - a.scoreRfrBrut;
            if (b.scoreDistanceBrut !== a.scoreDistanceBrut) return b.scoreDistanceBrut - a.scoreDistanceBrut;
            if (b.scoreTempsBrut !== a.scoreTempsBrut) return b.scoreTempsBrut - a.scoreTempsBrut;

            // 7. Nom de l'élève (départage alphabétique)
            const compNom = a.nom_eleve.localeCompare(b.nom_eleve, 'fr', { sensitivity: 'base' });
            if (compNom !== 0) return compNom;

            // 8. Prénom de l'élève (départage alphabétique)
            const prenomA = a.prenom_eleve || '';
            const prenomB = b.prenom_eleve || '';
            const compPrenom = prenomA.localeCompare(prenomB, 'fr', { sensitivity: 'base' });
            if (compPrenom !== 0) return compPrenom;

            // 9. Dernier départage par ordre de la ligne dans le fichier source
            return (a.numLigneFichier || 0) - (b.numLigneFichier || 0);
        });

        // 4. Attribution des rangs d'ordonnancement finaux
        return resultatsCalculatifs.map((eleve, index) => ({
            rang: index + 1,
            ...eleve
        }));
    }
};