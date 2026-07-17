const Scoring = {
    /**
     * Calcule les scores normalisés et globaux pour l'ensemble des élèves valides
     */
    calculerClassement(eleves, weights) {
        if (eleves.length === 0) return [];

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

        // Sécurité si les extremums sont identiques (évite la division par zéro)
        const rangeAge = (maxAge - minAge) || 1;
        const rangeDist = (maxDist - minDist) || 1;
        const rangeTemps = (maxTemps - minTemps) || 1;
        const rangeRfr = (maxRfr - minRfr) || 1;

        // 2. Calcul des scores individuels normalisés sur 100 
        const resultatsCalculatifs = eleves.map(e => {
            // Échelle Bourse : Non boursier = 0, Échelon 0 = 40, Échelon 1 à 6 = Progression linéaire jusqu'à 100
            let scoreNormBourse = 0;
            if (e.echelonBourse === 0) scoreNormBourse = 40;
            else if (e.echelonBourse > 0) scoreNormBourse = 40 + (e.echelonBourse * 10);

            // Échelle Âge : Les plus jeunes sont prioritaires (Normalisation inversée)
            const scoreNormAge = ((maxAge - e.age) / rangeAge) * 100;

            // Échelle RFR : Plus le RFR est bas, plus le score est élevé (Normalisation inversée)
            const scoreNormRfr = ((maxRfr - e.rfr_parents) / rangeRfr) * 100;

            // Échelle Distance & Temps : Priorité aux plus éloignés (Normalisation standard)
            const scoreNormDistance = ((e.distance_km - minDist) / rangeDist) * 100;
            const scoreNormTemps = ((e.temps_trajet_min - minTemps) / rangeTemps) * 100;

            // Calcul du score final pondéré (Somme des 5 critères d'évaluation)
            const scoreGlobal = (
                (scoreNormBourse * (weights.bourse / 100)) +
                (scoreNormAge * (weights.age / 100)) +
                (scoreNormRfr * (weights.rfr / 100)) +
                (scoreNormDistance * (weights.distance / 100)) +
                (scoreNormTemps * (weights.temps / 100))
            );

            return {
                ...e,
                scoreBourse: Math.round(scoreNormBourse * 100) / 100,
                scoreAge: Math.round(scoreNormAge * 100) / 100,
                scoreRfr: Math.round(scoreNormRfr * 100) / 100,
                scoreDistance: Math.round(scoreNormDistance * 100) / 100,
                scoreTemps: Math.round(scoreNormTemps * 100) / 100,
                scoreGlobal: Math.round(scoreGlobal * 100) / 100
            };
        });

        // 3. Tri strict selon la cascade d'arbitrage mise à jour
        resultatsCalculatifs.sort((a, b) => {
            // 1. Score Global
            if (b.scoreGlobal !== a.scoreGlobal) return b.scoreGlobal - a.scoreGlobal;
            // 2. Score Bourse
            if (b.scoreBourse !== a.scoreBourse) return b.scoreBourse - a.scoreBourse;
            // 3. Score Âge (priorité aux plus jeunes)
            if (b.scoreAge !== a.scoreAge) return b.scoreAge - a.scoreAge;
            // 4. Score RFR (Priorité au RFR le plus bas, donc au score RFR le plus élevé)
            if (b.scoreRfr !== a.scoreRfr) return b.scoreRfr - a.scoreRfr;
            // 5. Score Distance
            if (b.scoreDistance !== a.scoreDistance) return b.scoreDistance - a.scoreDistance;
            // 6. Score Temps de Trajet
            if (b.scoreTemps !== a.scoreTemps) return b.scoreTemps - a.scoreTemps;
            // 7. Nom de famille par ordre alphabétique
            return a.nom_eleve.localeCompare(b.nom_eleve, 'fr', { sensitivity: 'base' });
        });

        // 4. Attribution des rangs d'ordonnancement
        return resultatsCalculatifs.map((eleve, index) => ({
            rang: index + 1,
            ...eleve
        }));
    }
};