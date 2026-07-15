/**
 * Module de calcul mathématique des scores et classement
 */
const Scoring = {
    /**
     * Calcule les scores normalisés et globaux pour l'ensemble des élèves valides
     * @param {Array<Object>} eleves Liste des élèves préalablement validés
     * @param {Object} weights Coefficients de pondération (somme = 100)
     * @returns {Array<Object>} Elèves enrichis de leurs scores et classés
     */
    calculerClassement(eleves, weights) {
        if (eleves.length === 0) return [];

        // 1. Recherche des extremums pour la normalisation (Min/Max de l'échantillon) 
        let maxAge = -Infinity, minAge = Infinity;
        let maxDist = -Infinity, minDist = Infinity;
        let maxTemps = -Infinity, minTemps = Infinity;

        eleves.forEach(e => {
            if (e.age > maxAge) maxAge = e.age;
            if (e.age < minAge) minAge = e.age;
            if (e.distance_km > maxDist) maxDist = e.distance_km;
            if (e.distance_km < minDist) minDist = e.distance_km;
            if (e.temps_trajet_min > maxTemps) maxTemps = e.temps_trajet_min;
            if (e.temps_trajet_min < minTemps) minTemps = e.temps_trajet_min;
        });

        // Sécurité si les valeurs minimales et maximales de la population importée sont identiques
        const rangeAge = (maxAge - minAge) || 1;
        const rangeDist = (maxDist - minDist) || 1;
        const rangeTemps = (maxTemps - minTemps) || 1;

        // 2. Calcul des scores individuels normalisés sur 100 
        const resultatsCalculatifs = eleves.map(e => {
            // Échelle Bourse : Non boursier = 0, Échelon 0 = 40, Échelon 1 à 6 = Progression linéaire jusqu'à 100 [cite: 110, 118]
            let scoreNormBourse = 0;
            if (e.echelonBourse === 0) scoreNormBourse = 40;
            else if (e.echelonBourse > 0) scoreNormBourse = 40 + (e.echelonBourse * 10);

            // Échelle Âge : Les plus jeunes sont prioritaires (Normalisation inversée)
            const scoreNormAge = ((maxAge - e.age) / rangeAge) * 100;

            // Échelle Distance & Temps : Priorité aux plus éloignés
            const scoreNormDistance = ((e.distance_km - minDist) / rangeDist) * 100;
            const scoreNormTemps = ((e.temps_trajet_min - minTemps) / rangeTemps) * 100;

            // Calcul du score final pondéré [cite: 128]
            const scoreGlobal = (
                (scoreNormBourse * (weights.bourse / 100)) +
                (scoreNormAge * (weights.age / 100)) +
                (scoreNormDistance * (weights.distance / 100)) +
                (scoreNormTemps * (weights.temps / 100))
            );

            return {
                ...e,
                scoreBourse: Math.round(scoreNormBourse * 100) / 100,
                scoreAge: Math.round(scoreNormAge * 100) / 100,
                scoreDistance: Math.round(scoreNormDistance * 100) / 100,
                scoreTemps: Math.round(scoreNormTemps * 100) / 100,
                scoreGlobal: Math.round(scoreGlobal * 100) / 100
            };
        });

        // 3. Tri strict selon l'algorithme des égalités 
        resultatsCalculatifs.sort((a, b) => {
            // Comparaison principale sur le score global
            if (b.scoreGlobal !== a.scoreGlobal) {
                return b.scoreGlobal - a.scoreGlobal;
            }
            // Égalité 1 : Bourse [cite: 137]
            if (b.scoreBourse !== a.scoreBourse) {
                return b.scoreBourse - a.scoreBourse;
            }
            // Égalité 2 : Âge (priorité au plus jeune, donc au score normalisé d'âge le plus élevé) [cite: 138]
            if (b.scoreAge !== a.scoreAge) {
                return b.scoreAge - a.scoreAge;
            }
            // Égalité 3 : Distance [cite: 139]
            if (b.scoreDistance !== a.scoreDistance) {
                return b.scoreDistance - a.scoreDistance;
            }
            // Égalité 4 : Temps [cite: 140]
            if (b.scoreTemps !== a.scoreTemps) {
                return b.scoreTemps - a.scoreTemps;
            }
            // Égalité 5 : Tri Alphabétique du Nom [cite: 141]
            return a.nom_eleve.localeCompare(b.nom_eleve, 'fr', { sensitivity: 'base' });
        });

        // 4. Attribution des rangs d'ordonnancement [cite: 164]
        return resultatsCalculatifs.map((eleve, index) => ({
            rang: index + 1,
            ...eleve
        }));
    }
};