const Validation = {
    COLONNES_OBLIGATOIRES: [
        'nom_eleve',
        'date_naissance',
        'boursier',
        'distance_km',
        'temps_trajet_min',
        'situation_particuliere'
    ],

    validerEntetes(headers) {
        const headersNorm = headers.map(h => Utils.cleanString(h));
        const colonnesManquantes = [];

        this.COLONNES_OBLIGATOIRES.forEach(col => {
            if (!headersNorm.includes(Utils.cleanString(col))) {
                colonnesManquantes.push(col);
            }
        });

        return {
            valide: colonnesManquantes.length === 0,
            colonnesManquantes: colonnesManquantes
        };
    },

    validerLigne(row, index) {
        const erreurs = [];
        const donneesFormatees = {};

        // Normalisation de l'objet ligne pour tolérer n'importe quelle casse d'en-tête d'entrée
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
            normalizedRow[Utils.cleanString(key)] = row[key];
        });

        // 1. Vérification du Nom
        const nom = normalizedRow['nomeleve'] || normalizedRow['nom_eleve'];
        if (nom === undefined || nom === null || String(nom).trim() === '') {
            erreurs.push("Le nom de l'élève est manquant ou vide.");
        } else {
            donneesFormatees.nom_eleve = String(nom).trim();
        }

        // 2. Vérification de la Date de Naissance et calcul d'âge
        const dateNaisRaw = normalizedRow['datenaissance'] || normalizedRow['date_naissance'];
        let dateValide = false;
        let age = 0;

        if (!dateNaisRaw) {
            erreurs.push("La date de naissance est manquante.");
        } else {
            let dateObj = null;

            if (typeof dateNaisRaw === 'number') {
                if (window.XLSX && window.XLSX.SSF) {
                    const parsedDate = window.XLSX.SSF.parse_date_code(dateNaisRaw);
                    if (parsedDate) {
                        if (parsedDate.y < 100) {
                            erreurs.push(`Format d'année invalide (2 chiffres non autorisés) : "${parsedDate.y}". Veuillez saisir l'année complète sur 4 chiffres (ex: 2008).`);
                        } else {
                            dateObj = new Date(parsedDate.y, parsedDate.m - 1, parsedDate.d);
                        }
                    }
                }
            } else {
                const dateStr = String(dateNaisRaw).trim();
                if (dateStr.includes('/')) {
                    const parties = dateStr.split('/');
                    if (parties.length === 3) {
                        const jour = parseInt(parties[0], 10);
                        const mois = parseInt(parties[1], 10) - 1;
                        const anneeStr = parties[2].trim();

                        if (anneeStr.length !== 4) {
                            erreurs.push(`Format d'année invalide (2 chiffres non autorisés) : "${anneeStr}". Veuillez utiliser l'année complète à 4 chiffres (ex: 2008).`);
                        } else {
                            const annee = parseInt(anneeStr, 10);
                            dateObj = new Date(annee, mois, jour);
                        }
                    }
                } else {
                    const partiesIso = dateStr.split('-');
                    if (partiesIso[0] && partiesIso[0].trim().length !== 4) {
                        erreurs.push(`Format d'année invalide (2 chiffres non autorisés) : "${partiesIso[0]}". Veuillez utiliser l'année complète à 4 chiffres (ex: 2008).`);
                    } else {
                        dateObj = new Date(dateStr);
                    }
                }
            }

            if (erreurs.length === 0) {
                if (!dateObj || isNaN(dateObj.getTime())) {
                    erreurs.push(`Format de date de naissance invalide : ${dateNaisRaw}`);
                } else {
                    try {
                        age = Utils.calculerAgeAu01Sept2026(dateObj);
                        if (age < 0 || age > 30) {
                            erreurs.push(`L'âge calculé au 01/09/2026 (${age} ans) semble incohérent.`);
                        } else {
                            donneesFormatees.date_naissance = dateObj.toISOString().split('T')[0];
                            donneesFormatees.age = age;
                            dateValide = true;
                        }
                    } catch (e) {
                        erreurs.push("Impossible de calculer l'âge sur cette date.");
                    }
                }
            }
        }

        // 3. Vérification du statut boursier
        const boursierRaw = normalizedRow['boursier'];
        if (boursierRaw === undefined || boursierRaw === null || String(boursierRaw).trim() === '') {
            erreurs.push("Le statut boursier est manquant.");
        } else {
            const boursierStr = String(boursierRaw).trim();
            const boursierMatch = this.analyserBoursier(boursierStr);
            if (!boursierMatch.valide) {
                erreurs.push(`Format boursier inconnu : "${boursierStr}"`);
            } else {
                donneesFormatees.boursier = boursierMatch.label;
                donneesFormatees.echelonBourse = boursierMatch.echelon;
            }
        }

        // 4. Vérification de la distance
        const distRaw = normalizedRow['distancekm'] || normalizedRow['distance_km'];
        if (distRaw === undefined || distRaw === null || String(distRaw).trim() === '') {
            erreurs.push("La distance (km) est manquante.");
        } else {
            const distNum = parseFloat(String(distRaw).replace(',', '.'));
            if (isNaN(distNum)) {
                erreurs.push(`La distance doit être une valeur numérique (reçu : "${distRaw}").`);
            } else if (distNum < 0) {
                erreurs.push(`La distance ne peut pas être négative : ${distNum} km.`);
            } else {
                donneesFormatees.distance_km = distNum;
            }
        }

        // 5. Vérification du temps de trajet
        const tempsRaw = normalizedRow['tempstrajetmin'] || normalizedRow['temps_trajet_min'];
        if (tempsRaw === undefined || tempsRaw === null || String(tempsRaw).trim() === '') {
            erreurs.push("Le temps de trajet (min) est manquant.");
        } else {
            const tempsNum = parseInt(String(tempsRaw).replace(',', '.'), 10);
            if (isNaN(tempsNum)) {
                erreurs.push(`Le temps doit être un entier numérique (reçu : "${tempsRaw}").`);
            } else if (tempsNum < 0) {
                erreurs.push(`Le temps de trajet ne peut pas être négatif : ${tempsNum} min.`);
            } else {
                donneesFormatees.temps_trajet_min = tempsNum;
            }
        }

        // 6. Situation particulière
        const sitPart = normalizedRow['situationparticuliere'] || normalizedRow['situation_particuliere'];
        donneesFormatees.situation_particuliere = sitPart ? String(sitPart).trim() : '';

        return {
            valide: erreurs.length === 0,
            erreurs: erreurs,
            donneesFormatees: donneesFormatees
        };
    },

    analyserBoursier(str) {
        const clean = str.trim();
        const cleanLower = clean.toLowerCase();

        if (cleanLower === 'non') {
            return { valide: true, echelon: -1, label: 'Non' };
        }
        if (cleanLower === 'oui') {
            return { valide: true, echelon: 0, label: 'Oui (Échelon 0)' };
        }

        const match = clean.match(/(?:échelon|echelon)\s*([0-6])/i);
        if (match) {
            const echelon = parseInt(match[1], 10);
            return { valide: true, echelon: echelon, label: `Oui (Échelon ${echelon})` };
        }

        return { valide: false, echelon: -1, label: clean };
    }
};