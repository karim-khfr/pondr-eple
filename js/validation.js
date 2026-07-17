const Validation = {
    // Les clés applicatives cibles requises pour le calcul
    ATTENDUS_OBLIGATOIRES: {
        nom_eleve: "Nom de l'élève",
        date_naissance: "Date de naissance",
        boursier: "Statut boursier",
        distance_km: "Distance famille (km)",
        temps_trajet_min: "Temps de trajet (min)",
        rfr_parents: "Revenu Fiscal de Référence (RFR)"
    },

    /**
     * Valide un champ RFR : doit être un nombre positif, gère les espaces et virgules
     */
    validerEtFormaterRfr(valeurRaw) {
        if (valeurRaw === undefined || valeurRaw === null || String(valeurRaw).trim() === '') {
            return { valide: false, erreur: "Le Revenu Fiscal de Référence (RFR) est manquant ou vide." };
        }

        // CORRECTION AUDIT : Validation Regex stricte + isFinite
        const net = String(valeurRaw).replace(/\s/g, '').replace(',', '.');
        if (!/^\d+(?:\.\d+)?$/.test(net)) {
            return { valide: false, erreur: `Le RFR doit être une valeur numérique stricte (reçu : "${valeurRaw}").` };
        }

        const rfrNum = parseFloat(net);
        if (!Number.isFinite(rfrNum)) {
            return { valide: false, erreur: "Le RFR fourni est invalide (valeur infinie)." };
        }
        if (rfrNum < 0) {
            return { valide: false, erreur: `Le RFR ne peut pas être négatif (reçu : ${rfrNum} €).` };
        }
        return { valide: true, valeur: rfrNum };
    },

    /**
     * Analyse et valide une ligne brute en s'appuyant sur le mapping dynamique fourni
     */
    validerLigne(row, index, mapping) {
        const erreurs = [];
        const donneesFormatees = {};

        // On récupère toutes les clés d'origine de la ligne
        const clesOrigine = Object.keys(row);

        // Identifier les clés associées (mappées)
        const clesMappeesOrigine = Object.values(mapping);

        // 1. Validation des champs mappés obligatoires

        // --- Nom ---
        const cleNom = mapping['nom_eleve'];
        const nom = row[cleNom];
        if (nom === undefined || nom === null || String(nom).trim() === '') {
            erreurs.push("Le nom de l'élève est manquant ou vide.");
        } else {
            donneesFormatees.nom_eleve = String(nom).trim();
        }

        // --- Date de Naissance / Âge ---
        const cleDate = mapping['date_naissance'];
        const dateNaisRaw = row[cleDate];
        let dateValide = false;
        let age = 0;

        if (!dateNaisRaw) {
            erreurs.push("La date de naissance est manquante.");
        } else {
            let dateObj = null;
            let anneeLue, moisLu, jourLu;

            if (typeof dateNaisRaw === 'number') {
                if (window.XLSX && window.XLSX.SSF) {
                    const parsedDate = window.XLSX.SSF.parse_date_code(dateNaisRaw);
                    if (parsedDate) {
                        anneeLue = parsedDate.y;
                        moisLu = parsedDate.m - 1; // 0-11 en JS
                        jourLu = parsedDate.d;
                        dateObj = new Date(anneeLue, moisLu, jourLu);
                    }
                }
            } else {
                const dateStr = String(dateNaisRaw).trim();
                if (dateStr.includes('/')) {
                    const parties = dateStr.split('/');
                    if (parties.length === 3) {
                        jourLu = parseInt(parties[0], 10);
                        moisLu = parseInt(parties[1], 10) - 1;
                        anneeLue = parseInt(parties[2].trim(), 10);
                        dateObj = new Date(anneeLue, moisLu, jourLu);
                    }
                } else {
                    const partiesIso = dateStr.split('-');
                    if (partiesIso.length === 3) {
                        anneeLue = parseInt(partiesIso[0].trim(), 10);
                        moisLu = parseInt(partiesIso[1], 10) - 1;
                        jourLu = parseInt(partiesIso[2], 10);
                        dateObj = new Date(anneeLue, moisLu, jourLu);
                    }
                }
            }

            if (!dateObj || isNaN(dateObj.getTime())) {
                erreurs.push(`Format de date de naissance invalide : ${dateNaisRaw}`);
            } else {
                // --- CORRECTION AUDIT : Validation stricte contre le débordement calendaire ---
                const dateConforme =
                    dateObj.getFullYear() === anneeLue &&
                    dateObj.getMonth() === moisLu &&
                    dateObj.getDate() === jourLu;

                if (!dateConforme) {
                    erreurs.push(`La date de naissance saisie est inexistante dans le calendrier : ${dateNaisRaw}`);
                } else if (anneeLue < 1900 || anneeLue > 2026) {
                    erreurs.push(`L'année de naissance doit être cohérente (reçu : ${anneeLue}).`);
                } else {
                    try {
                        age = Utils.calculerAgeAu01Sept2026(dateObj);
                        if (age < 0 || age > 30) {
                            erreurs.push(`L'âge calculé au 01/09/2026 (${age} ans) est incohérent.`);
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

        // --- Statut Boursier ---
        const cleBourse = mapping['boursier'];
        const boursierRaw = row[cleBourse];
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

        // --- Distance ---
        const cleDist = mapping['distance_km'];
        const distRaw = row[cleDist];
        if (distRaw === undefined || distRaw === null || String(distRaw).trim() === '') {
            erreurs.push("La distance (km) est manquante.");
        } else {
            // Nettoyage et validation stricte du format décimal complet
            const texteDist = String(distRaw).trim().replace(/\s/g, '').replace(',', '.');
            if (!/^\d+(?:\.\d+)?$/.test(texteDist)) {
                erreurs.push(`La distance doit être une valeur numérique stricte (reçu : "${distRaw}").`);
            } else {
                const distNum = parseFloat(texteDist);
                if (!Number.isFinite(distNum)) { // CORRECTION AUDIT : Empêcher Infinity
                    erreurs.push("La distance fournie est invalide (valeur infinie).");
                } else if (distNum < 0) {
                    erreurs.push(`La distance ne peut pas être négative : ${distNum} km.`);
                } else {
                    donneesFormatees.distance_km = distNum;
                }
            }
        }

        // --- Temps de trajet ---
        const cleTemps = mapping['temps_trajet_min'];
        const tempsRaw = row[cleTemps];
        if (tempsRaw === undefined || tempsRaw === null || String(tempsRaw).trim() === '') {
            erreurs.push("Le temps de trajet (min) est manquant.");
        } else {
            // Nettoyage et validation stricte d'un entier pur
            const texteTemps = String(tempsRaw).trim().replace(/\s/g, '');
            if (!/^\d+$/.test(texteTemps)) {
                erreurs.push(`Le temps de trajet doit être un entier numérique strict (reçu : "${tempsRaw}").`);
            } else {
                const tempsNum = parseInt(texteTemps, 10);
                if (tempsNum < 0) {
                    erreurs.push(`Le temps de trajet ne peut pas être négatif : ${tempsNum} min.`);
                } else {
                    donneesFormatees.temps_trajet_min = tempsNum;
                }
            }
        }

        // Validation du RFR à l'intérieur de validerLigne()
        const cleRfr = mapping['rfr_parents'];
        const rfrRaw = row[cleRfr];

        // Appel de la fonction de filtrage strict
        const rfrValidation = this.validerEtFormaterRfr(rfrRaw);

        if (!rfrValidation.valide) {
            // Si la valeur est négative, textuelle ou infinie, on rejette la ligne complète
            erreurs.push(rfrValidation.erreur);
        } else {
            // La valeur est garantie numérique, positive et finie : prête pour scoring.js
            donneesFormatees.rfr_parents = rfrValidation.valeur;
        }

        // 2. CONSERVATION DES COLONNES NON ASSOCIÉES (MÉTADONNÉES)
        donneesFormatees.metadonnees_hors_mapping = {};
        clesOrigine.forEach(cle => {
            if (!clesMappeesOrigine.includes(cle)) {
                donneesFormatees.metadonnees_hors_mapping[cle] = row[cle];
            }
        });

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