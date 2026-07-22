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
    validerLigne(row, mapping, dateReferenceUtilisee) {
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
        let age = 0;

        if (!dateNaisRaw) {
            erreurs.push("La date de naissance est manquante.");
        } else {
            let dateObj = null;
            let anneeLue, moisLu, jourLu;

            // Branchement tripartite pour gérer les objets Date, les nombres et le texte
            if (dateNaisRaw instanceof Date) {
                if (!Number.isNaN(dateNaisRaw.getTime())) {
                    // Extraction locale des composants pour contourner les fuseaux horaires
                    anneeLue = dateNaisRaw.getFullYear();
                    moisLu = dateNaisRaw.getMonth(); // Déjà au format 0-11
                    jourLu = dateNaisRaw.getDate();

                    // Sécurisation à midi pour les comparaisons futures
                    dateObj = new Date(anneeLue, moisLu, jourLu, 12, 0, 0);
                }
            } else if (typeof dateNaisRaw === 'number') {
                if (window.XLSX && window.XLSX.SSF) {
                    const parsedDate = window.XLSX.SSF.parse_date_code(dateNaisRaw);
                    if (parsedDate) {
                        anneeLue = parsedDate.y;
                        moisLu = parsedDate.m - 1; // 0-11 en JS
                        jourLu = parsedDate.d;
                        // Sécurisation à midi également ici
                        dateObj = new Date(anneeLue, moisLu, jourLu, 12, 0, 0);
                    }
                }
            } else {
                const dateStr = String(dateNaisRaw).trim();
                const matchFr = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                const matchIso = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);

                if (matchFr) {
                    jourLu = Number(matchFr[1]);
                    moisLu = Number(matchFr[2]) - 1;
                    anneeLue = Number(matchFr[3]);
                    dateObj = new Date(anneeLue, moisLu, jourLu, 12, 0, 0);
                } else if (matchIso) {
                    anneeLue = Number(matchIso[1]);
                    moisLu = Number(matchIso[2]) - 1;
                    jourLu = Number(matchIso[3]);
                    dateObj = new Date(anneeLue, moisLu, jourLu, 12, 0, 0);
                } // Pas de 'else' ici, si aucun match, dateObj reste null et sera capturé par le "if (!dateObj)" suivant
            }

            if (!dateObj || isNaN(dateObj.getTime())) {
                erreurs.push(`Format de date de naissance invalide : ${dateNaisRaw}`);
            } else {
                // Validation stricte contre le débordement calendaire
                const dateConforme =
                    dateObj.getFullYear() === anneeLue &&
                    dateObj.getMonth() === moisLu &&
                    dateObj.getDate() === jourLu;

                // Validation stricte et autonome de la date de référence globale
                const dateRefObj = Utils.parseDateLocale(dateReferenceUtilisee);
                if (!dateRefObj) {
                    throw new Error(`La date de référence utilisée pour le calcul de l'âge ("${dateReferenceUtilisee}") est invalide.`);
                }

                const anneeMaxReference = dateRefObj.getFullYear();

                if (!dateConforme) {
                    erreurs.push(`La date de naissance saisie est inexistante dans le calendrier : ${dateNaisRaw}`);
                } else if (anneeLue < 1900 || anneeLue > anneeMaxReference) {
                    erreurs.push(`L'année de naissance doit être cohérente (reçu : ${anneeLue}).`);
                } else {
                    try {
                        // --- CORRECTION ICI : Utiliser la variable passée en paramètre ---
                        age = Utils.calculerAgeDynamique(dateObj, dateReferenceUtilisee);
                        if (age < 0 || age > 30) {
                            erreurs.push(`L'âge calculé au ${Utils.formatDateFr(dateReferenceUtilisee)} (${age} ans) est incohérent.`);
                        } else {
                            const pad = valeur => String(valeur).padStart(2, '0');
                            donneesFormatees.date_naissance = `${anneeLue}-${pad(moisLu + 1)}-${pad(jourLu)}`;
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

        // Temps de trajet
        const cleTemps = mapping['temps_trajet_min'];
        const tempsRaw = row[cleTemps];
        if (tempsRaw === undefined || tempsRaw === null || String(tempsRaw).trim() === '') {
            erreurs.push("Le temps de trajet (min) est manquant.");
        } else {
            // Nettoyage et validation d'un nombre
            const texteTemps = String(tempsRaw).trim().replace(/\s/g, '');
            if (!/^\d+$/.test(texteTemps)) {
                erreurs.push(`Le temps de trajet doit être un entier numérique strict (reçu : "${tempsRaw}").`);
            } else {
                const tempsNum = Number(texteTemps);

                if (!Number.isSafeInteger(tempsNum)) {
                    erreurs.push(`Le temps de trajet doit être un entier valide (reçu : "${tempsRaw}").`);
                } else if (tempsNum < 0) {
                    erreurs.push(`Le temps de trajet ne peut pas être négatif : ${tempsNum} min.`);
                } else if (tempsNum > 180) {
                    erreurs.push(`Le temps de trajet dépasse la limite autorisée de 180 minutes (reçu : ${tempsNum} min).`);
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

        // Format 1 : Absences de bourse (Uniquement le texte "Non")
        if (cleanLower === 'non') {
            return { valide: true, echelon: -1, label: 'Non' };
        }

        // Format 2 : Cas du "Oui" ou du chiffre "0" (traités comme Échelon 0)
        if (cleanLower === 'oui' || cleanLower === '0') {
            return { valide: true, echelon: 0, label: 'Boursier échelon 0' };
        }

        // Définition des expressions régulières strictement ancrées (^ et $)
        // On remplace [ée] par [ée\uFFFD] pour intercepter le caractère corrompu 
        const regexChiffreSeul = /^([1-6])$/;
        const regexEchelonSeul = /^[ée\uFFFD]chelon\s*([0-6])$/;
        const regexBoursierEchelon = /^boursier\s*[ée\uFFFD]chelon\s*([0-6])$/;

        let match;

        // Format 3 : Chiffre seul ("4")
        if ((match = cleanLower.match(regexChiffreSeul))) {
            const echelon = parseInt(match[1], 10);
            return { valide: true, echelon: echelon, label: `Boursier échelon ${echelon}` };
        }

        // Format 4 : Mention "Échelon X", "Echelon X", "échelon X" ou "chelon X"
        if ((match = cleanLower.match(regexEchelonSeul))) {
            const echelon = parseInt(match[1], 10);
            return { valide: true, echelon: echelon, label: `Boursier échelon ${echelon}` };
        }

        // Format 5 : Mention complète "Boursier Échelon X" ou "Boursier chelon X"
        if ((match = cleanLower.match(regexBoursierEchelon))) {
            const echelon = parseInt(match[1], 10);
            return { valide: true, echelon: echelon, label: `Boursier échelon ${echelon}` };
        }

        // Tout le reste (ex: "ancien échelon 4 supprimé", "abc echelon6 abc") est rejeté
        return { valide: false, echelon: -1, label: clean };
    }
};