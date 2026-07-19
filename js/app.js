const App = {
    version: "1.5.0",
    fichierCharge: null,
    lignesBrutes: [],
    enTetesFichier: [],
    mappingSelectionne: {},
    elevesValides: [],
    dossiersRejetes: [],
    traitementEnCours: false, // <-- ajout d'un verrou de sécurité
    coefficients: { bourse: 40, age: 20, distance: 20, rfr: 10, temps: 10 },
    dateReferenceParDefaut: "2026-09-01", // Mettre à jour ici pour la valeur du reset.
    dateReference: "2026-09-01",

    init() {
        this.afficherVersion();
        this.chargerCoefficientsDepuisStockage();
        this.liaisonEvenementsFormulaire();
        this.liaisonEvenementsZoneDepot();
        this.liaisonEvenementsActions();
        this.liaisonEvenementsTableau();
    },

    afficherVersion() {
        const elementVersion = document.getElementById('app-version');
        if (elementVersion) {
            elementVersion.textContent = this.version;
        }
    },

    chargerCoefficientsDepuisStockage() {
        const stock = localStorage.getItem('internat_coefficients_v2');
        const parDefaut = { bourse: 40, age: 20, distance: 20, rfr: 10, temps: 10 };

        if (stock) {
            try {
                const charges = JSON.parse(stock);
                const cles = ['bourse', 'age', 'distance', 'rfr', 'temps'];

                // CORRECTIF DE SÉCURITÉ : Remplacement de !isNaN par Number.isFinite
                const valides = cles.every(cle =>
                    typeof charges[cle] === 'number' &&
                    Number.isFinite(charges[cle]) &&
                    charges[cle] >= 0
                );

                const sommeCorrecte = valides && (cles.reduce((sum, cle) => sum + charges[cle], 0) === 100);

                if (valides && sommeCorrecte) {
                    this.coefficients = charges;
                } else {
                    this.coefficients = parDefaut;
                    localStorage.setItem('internat_coefficients_v2', JSON.stringify(this.coefficients));
                }
            } catch (e) {
                this.coefficients = parDefaut;
            }
        } else {
            this.coefficients = parDefaut;
        }

        document.getElementById('weight-bourse').value = this.coefficients.bourse;
        document.getElementById('weight-age').value = this.coefficients.age;
        document.getElementById('weight-distance').value = this.coefficients.distance;
        document.getElementById('weight-rfr').value = this.coefficients.rfr;
        document.getElementById('weight-temps').value = this.coefficients.temps;

        // SÉCURISATION DU LOCALSTORAGE POUR LA DATE DE RÉFÉRENCE
        const dateStockee = localStorage.getItem('pond_date_ref');

        // 1. Vérification du format strict YYYY-MM-DD
        if (dateStockee && /^\d{4}-\d{2}-\d{2}$/.test(dateStockee)) {
            const dateParse = new Date(`${dateStockee}T12:00:00`);

            // 2. Découpage pour valider la cohérence calendaire (ex: rejeter le 31 février)
            const [annee, mois, jour] = dateStockee.split('-').map(Number);
            const dateCalendaireValide =
                !isNaN(dateParse.getTime()) &&
                dateParse.getFullYear() === annee &&
                (dateParse.getMonth() + 1) === mois &&
                dateParse.getDate() === jour;

            this.dateReference = dateCalendaireValide ? dateStockee : this.dateReferenceParDefaut;
        } else {
            this.dateReference = this.dateReferenceParDefaut;
        }

        // Si la valeur en mémoire était corrompue, on la nettoie immédiatement
        if (dateStockee !== this.dateReference) {
            localStorage.setItem('pond_date_ref', this.dateReference);
        }

        document.getElementById('config-date-ref').value = this.dateReference;
    },

    liaisonEvenementsFormulaire() {
        const form = document.getElementById('settings-form');
        const btnReset = document.getElementById('reset-weights');

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // 1. Extraction et conversion stricte au format numérique (sans troncature)
            const wBourse = Number(document.getElementById('weight-bourse').value);
            const wAge = Number(document.getElementById('weight-age').value);
            const wDistance = Number(document.getElementById('weight-distance').value);
            const wRfr = Number(document.getElementById('weight-rfr').value);
            const wTemps = Number(document.getElementById('weight-temps').value);

            // 2. SÉCURITÉ DE TYPE : On s'assure qu'aucun coefficient n'est un nombre décimal
            const tousEntiers = [wBourse, wAge, wDistance, wRfr, wTemps].every(valeur =>
                Number.isInteger(valeur)
            );

            if (!tousEntiers) {
                alert("Erreur de saisie : Les coefficients doivent obligatoirement être des nombres entiers. Les valeurs décimales ne sont pas autorisées.");
                return; // Interruption immédiate du traitement
            }

            const nouvelleDate = document.getElementById('config-date-ref').value;
            if (!nouvelleDate) {
                alert("Veuillez spécifier une date de référence valide.");
                return;
            }

            // 3. ÉTAPE DE VALIDATION DES COEFFICIENTS (Calcul en amont)
            const total = wBourse + wAge + wDistance + wRfr + wTemps;
            if (wBourse < 0 || wAge < 0 || wDistance < 0 || wRfr < 0 || wTemps < 0 || total !== 100) {
                alert(`Erreur critique : La somme des coefficients doit être strictement égale à 100%.\nActuel : ${total}%`);
                return; // Interruption : aucune modification d'état ou persistance locale n'est appliquée
            }

            // 4. ÉTAPE DE MODIFICATION (La validation a réussi)
            const dateModifiee = nouvelleDate !== this.dateReference;

            this.dateReference = nouvelleDate;
            localStorage.setItem('pond_date_ref', nouvelleDate);

            this.coefficients = { bourse: wBourse, age: wAge, distance: wDistance, rfr: wRfr, temps: wTemps };
            localStorage.setItem('internat_coefficients_v2', JSON.stringify(this.coefficients));
            alert("Les coefficients et paramètres ont été enregistrés avec succès.");

            // Application de la logique d'Option 1 s'il y a déjà des données chargées
            if (dateModifiee && this.lignesBrutes.length > 0 && Object.keys(this.mappingSelectionne).length > 0) {
                // Affichage explicite de la barre de progression
                const progressContainer = document.getElementById('progress-container');
                document.getElementById('process-actions').classList.remove('hidden');
                progressContainer.classList.remove('hidden');
                this.mettreAJourProgression(0, "Progression du recadrage et de la mise à jour des paramètres");

                this.lancerTraitementParTranches(() => {
                    document.getElementById('process-actions').classList.add('hidden');
                });
            } else if (this.elevesValides.length > 0) {
                // Si la date n'a pas changé mais que les coefficients ont changé, on recalcule uniquement le score
                this.executerClassementEtAffichage();
            }
        });

        btnReset.addEventListener('click', () => {
            document.getElementById('weight-bourse').value = 40;
            document.getElementById('weight-age').value = 20;
            document.getElementById('weight-distance').value = 20;
            document.getElementById('weight-rfr').value = 10;
            document.getElementById('weight-temps').value = 10;

            // Correction de la référence circulaire (Utilisation de `this` au lieu de `App`)
            document.getElementById('config-date-ref').value = this.dateReferenceParDefaut;

            localStorage.removeItem('pond_date_ref');

            form.requestSubmit();
        });
    },

    liaisonEvenementsZoneDepot() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');

        // 1. Gestion du Glisser-Déposer (Drag & Drop)
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                this.traiterFichierSelectionne(e.dataTransfer.files[0]);
            }
        });

        // 2. Gestion du Clic Souris sur la zone
        dropZone.addEventListener('click', (e) => {
            if (e.target !== fileInput) {
                fileInput.click();
            }
        });

        // 3. Sécurisation du clic : reset de la valeur pour forcer le déclenchement de 'change'
        fileInput.addEventListener('click', (e) => {
            e.stopPropagation(); // Empêche la Dropzone de capter le clic en boucle
            fileInput.value = ''; // Réinitialise la valeur pour autoriser la ré-sélection du même fichier
        });

        // 4. Gestion de l'Accessibilité Clavier
        dropZone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInput.click();
            }
        });

        // 5. Écoute du changement de fichier
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.traiterFichierSelectionne(e.target.files[0]);
            }
        });
    },

    TAILLE_MAX_FICHIER_OCTETS: 10 * 1024 * 1024,

    // Dictionnaire d'alias stricts pour le pré-mapping sémantique
    ALIAS_DICTIONNAIRE: {
        nom_eleve: ['nom', 'nomeleve', 'eleve', 'identite', 'nomprenom'],
        date_naissance: ['datenaissance', 'naissance', 'naissanceeleve', 'date_naiss', 'datenaiss'],
        boursier: ['boursier', 'statutboursier', 'bourse', 'echelonbourse', 'echelon'],
        distance_km: ['distancefamillekm', 'distancekm', 'distancefamille', 'distance', 'eloignementfamille'],
        temps_trajet_min: ['tempstrajetmin', 'tempstrajet', 'tempstrajeteleve', 'trajetmin'],
        rfr_parents: ['revenufiscaldereference', 'rfr', 'revenufiscal', 'rfrparents']
    },

    async traiterFichierSelectionne(file) {
        if (this.traitementEnCours) {
            alert("Un traitement est actuellement en cours. Veuillez patienter jusqu'à sa finalisation avant d'importer un nouveau fichier.");
            return;
        }

        const ext = file.name.split('.').pop().toLowerCase();
        if (ext !== 'xlsx' && ext !== 'csv') {
            alert("Format non valide. Veuillez importer un fichier Microsoft Excel (.xlsx) ou un fichier CSV.");
            return;
        }

        if (file.size > this.TAILLE_MAX_FICHIER_OCTETS) {
            const tailleMo = (file.size / (1024 * 1024)).toFixed(1);
            alert(`Le fichier sélectionné (${tailleMo} Mo) dépasse la taille maximale autorisée de 10 Mo.`);
            return;
        }

        // On récupère les éléments du DOM dès le début pour les rendre disponibles partout dans la méthode
        const fileInput = document.getElementById('file-input');
        const fileInfo = document.getElementById('file-info');

        this.fichierCharge = file;
        if (fileInfo) {
            fileInfo.innerHTML = `Fichier sélectionné : ${Utils.escapeHTML(file.name)} (${(file.size / 1024).toFixed(1)} Ko)`;
            fileInfo.classList.remove('hidden');
        }

        try {
            this.lignesBrutes = await Parser.analyserFichier(file);
            this.enTetesFichier = Object.keys(this.lignesBrutes[0] || {});

            if (this.enTetesFichier.length === 0) {
                throw new Error("Le fichier importé ne contient aucune donnée.");
            }

            document.getElementById('drop-zone').classList.add('hidden');
            this.genererInterfaceMapping();

            // Maintenant, fileInput est bien défini et accessible ici !
            if (fileInput) {
                fileInput.value = '';
            }

            document.getElementById('process-actions').classList.add('hidden');
            document.getElementById('errors-section').classList.add('hidden');
            document.getElementById('results-section').classList.add('hidden');
        } catch (err) {
            // Réinitialisation des états internes de l'application
            this.fichierCharge = null;
            this.lignesBrutes = [];
            this.enTetesFichier = [];

            // Nettoyage et masquage de l'UI d'information du fichier
            if (fileInfo) {
                fileInfo.textContent = '';
                fileInfo.classList.add('hidden');
            }

            // Plus besoin de redéclarer "const fileInput", il est déjà disponible
            if (fileInput) {
                fileInput.value = '';
            }

            // Notification à l'utilisateur
            alert(err.message);
        }
    },

    genererInterfaceMapping() {
        const container = document.getElementById('mapping-container');
        const selectorsGrid = document.getElementById('mapping-selectors-grid');
        selectorsGrid.innerHTML = '';
        this.mappingSelectionne = {};

        Object.entries(Validation.ATTENDUS_OBLIGATOIRES).forEach(([cleApplicative, label]) => {
            const divGroup = document.createElement('div');
            divGroup.className = 'control-group';
            divGroup.style.display = 'flex';
            divGroup.style.flexDirection = 'column';
            divGroup.style.gap = '0.4rem';

            // Entête du groupe (Label + Badge suggestion)
            const labelContainer = document.createElement('div');
            labelContainer.style.display = 'flex';
            labelContainer.style.justifyContent = 'between';
            labelContainer.style.alignItems = 'center';
            labelContainer.style.justifyContent = 'space-between';

            const select = document.createElement('select');
            select.id = `map-${cleApplicative}`;
            select.style.width = "100%";
            select.style.padding = "0.4rem";

            const labelEl = document.createElement('label');
            labelEl.textContent = label + " :";
            labelEl.style.fontWeight = "600";
            labelEl.setAttribute('for', select.id);
            labelContainer.appendChild(labelEl);

            // Badge suggestion automatique (masqué par défaut)
            const badgeSuggestion = document.createElement('span');
            badgeSuggestion.textContent = "💡 Suggestion automatique";
            badgeSuggestion.style.fontSize = "0.75rem";
            badgeSuggestion.style.backgroundColor = "#e1f5fe";
            badgeSuggestion.style.color = "#0288d1";
            badgeSuggestion.style.padding = "0.2rem 0.5rem";
            badgeSuggestion.style.borderRadius = "4px";
            badgeSuggestion.style.fontWeight = "500";
            badgeSuggestion.className = "hidden";
            labelContainer.appendChild(badgeSuggestion);

            divGroup.appendChild(labelContainer);

            // Options du Select
            const optDefault = document.createElement('option');
            optDefault.value = "";
            optDefault.textContent = "-- Choisissez une colonne --";
            select.appendChild(optDefault);

            this.enTetesFichier.forEach(header => {
                const opt = document.createElement('option');
                opt.value = header;
                opt.textContent = header;
                select.appendChild(opt);
            });

            divGroup.appendChild(select);

            // Zone d'aperçu des 3 premières valeurs de données
            const previewContainer = document.createElement('div');
            previewContainer.id = `preview-${cleApplicative}`;
            previewContainer.style.fontSize = "0.8rem";
            previewContainer.style.color = "var(--text-muted, #666)";
            previewContainer.style.backgroundColor = "#f8f9fa";
            previewContainer.style.padding = "0.4rem";
            previewContainer.style.borderRadius = "4px";
            previewContainer.style.border = "1px solid #e2e8f0";
            divGroup.appendChild(previewContainer);

            selectorsGrid.appendChild(divGroup);

            // --- ALGORITHME DE CORRESPONDANCE STRICTE & ALIAS ---
            const targetNorm = Utils.cleanString(cleApplicative).replace(/_|-|\s/g, '');
            let correspondanceTrouvee = "";

            for (const header of this.enTetesFichier) {
                const headerNorm = Utils.cleanString(header).replace(/_|-|\s/g, '');

                // 1. Recherche de correspondance exacte
                if (headerNorm === targetNorm) {
                    correspondanceTrouvee = header;
                    break;
                }

                // 2. Recherche dans le dictionnaire d'alias stricts
                const listeAlias = this.ALIAS_DICTIONNAIRE[cleApplicative] || [];
                if (listeAlias.includes(headerNorm)) {
                    correspondanceTrouvee = header;
                    break;
                }
            }

            // 3. Aucune présélection approximative si rien n'est trouvé
            if (correspondanceTrouvee) {
                select.value = correspondanceTrouvee;
                badgeSuggestion.classList.remove('hidden');
            }

            // Fonction interne de mise à jour de l'aperçu (3 valeurs)
            const rafraichirApercuData = () => {
                const colonneSelectionnee = select.value;
                if (!colonneSelectionnee) {
                    previewContainer.innerHTML = "<em>Aucune colonne sélectionnée (Pas d'aperçu)</em>";
                    return;
                }

                // Extraction sécurisée des 3 premières lignes de données réelles
                const exemples = this.lignesBrutes.slice(0, 3)
                    .map(ligne => ligne[colonneSelectionnee])
                    .map(valeur => (valeur !== undefined && valeur !== null && String(valeur).trim() !== '') ? Utils.escapeHTML(valeur) : '📂 (vide)');

                previewContainer.innerHTML = `<strong>Aperçu :</strong> ${exemples.join(' | ')}`;
            };

            // Écouteur de changement manuel par l'utilisateur
            select.addEventListener('change', () => {
                // Si l'utilisateur change la valeur par rapport à la suggestion auto, on masque le badge
                badgeSuggestion.classList.add('hidden');
                rafraichirApercuData();
            });

            // Premier rendu de l'aperçu au chargement de l'interface
            rafraichirApercuData();
        });

        container.classList.remove('hidden');
    },

    liaisonEvenementsActions() {
        const btnValiderMapping = document.getElementById('btn-valider-mapping');
        const progressContainer = document.getElementById('progress-container');

        btnValiderMapping.addEventListener('click', () => {
            // 1. SÉCURITÉ LOGIQUE : Si un traitement est déjà lancé, on avorte immédiatement
            if (this.traitementEnCours) return;

            const mappingTemporaire = {};
            let toutMappe = true;

            Object.keys(Validation.ATTENDUS_OBLIGATOIRES).forEach(cle => {
                const select = document.getElementById(`map-${cle}`);
                if (!select.value) {
                    toutMappe = false;
                }
                mappingTemporaire[cle] = select.value;
            });

            if (!toutMappe) {
                alert("Veuillez associer l'ensemble des 6 critères obligatoires pour pouvoir lancer le traitement.");
                return;
            }

            const colonnesChoisies = Object.values(mappingTemporaire);
            const ensembleUnique = new Set(colonnesChoisies);
            if (ensembleUnique.size !== colonnesChoisies.length) {
                alert("Erreur de configuration : Chaque colonne de votre fichier ne peut être associée qu'à un seul critère.");
                return;
            }

            // 2. SÉCURITÉ VISUELLE : Désactivation immédiate du bouton pour éviter le multi-clic
            btnValiderMapping.disabled = true;

            this.mappingSelectionne = mappingTemporaire;

            document.getElementById('mapping-container').classList.add('hidden');
            document.getElementById('drop-zone').classList.remove('hidden');

            document.getElementById('process-actions').classList.remove('hidden');
            progressContainer.classList.remove('hidden');
            this.mettreAJourProgression(0, "Progression du traitement et de l'analyse du fichier étudiant");

            // 3. LANCEMENT : Le verrou `this.traitementEnCours` passera à `true` dès la première ligne de cette méthode
            this.lancerTraitementParTranches(() => {
                document.getElementById('process-actions').classList.add('hidden');

                // 4. LIBÉRATION : Réactivation du bouton une fois l'intégralité du traitement fini
                btnValiderMapping.disabled = false;
            });
        });

        document.getElementById('btn-export-excel').addEventListener('click', (e) => {
            if (e.currentTarget.disabled) return;
            const classementOfficiel = [...TableManager.donneesFiltrees].sort((a, b) => a.rang - b.rang);
            ExportManager.exporterVersExcel(classementOfficiel, this.coefficients, this.enTetesFichier, this.mappingSelectionne, this.dateReference);
        });

        document.getElementById('btn-export-csv').addEventListener('click', (e) => {
            if (e.currentTarget.disabled) return;
            const classementOfficiel = [...TableManager.donneesFiltrees].sort((a, b) => a.rang - b.rang);
            // Nettoyage de l'appel en retirant les coefficients et la date de référence inutilisés
            ExportManager.exporterVersCSV(classementOfficiel, this.enTetesFichier, this.mappingSelectionne);
        });
    },

    liaisonEvenementsTableau() {
        const searchInput = document.getElementById('search-input');
        const filterBourse = document.getElementById('filter-bourse');

        if (searchInput && filterBourse) {
            searchInput.addEventListener('input', () => {
                TableManager.filtrer(searchInput.value, filterBourse.value);
            });
            filterBourse.addEventListener('change', () => {
                TableManager.filtrer(searchInput.value, filterBourse.value);
            });
        }

        // Cibler les boutons à l'intérieur des TH triables
        document.querySelectorAll('#results-table th[data-sort] button').forEach(button => {
            const th = button.closest('th');

            button.addEventListener('click', () => {
                TableManager.trier(th.dataset.sort);
            });
        });
    },

    mettreAJourProgression(pourcentage, texteAccessible = null) {
        const progressContainer = document.getElementById('progress-container');
        const progressBar = document.getElementById('progress-bar');
        const arrondi = Math.min(100, Math.max(0, Math.round(pourcentage)));

        progressBar.style.width = `${arrondi}%`;
        progressBar.textContent = `${arrondi}%`;
        progressContainer.setAttribute('aria-valuenow', arrondi);

        // ÉTAPE 3 : Mise à jour dynamique du nom accessible si fourni
        if (texteAccessible && progressContainer) {
            progressContainer.setAttribute('aria-label', texteAccessible);
        }
    },

    lancerTraitementParTranches(callbackFin) {
        this.elevesValides = [];
        this.dossiersRejetes = [];

        this.traitementEnCours = true;
        const lignesATraiter = [...this.lignesBrutes];
        const mappingUtilise = { ...this.mappingSelectionne };
        const dateReferenceUtilisee = this.dateReference;
        const total = lignesATraiter.length;

        if (total === 0) {
            this.traitementEnCours = false;
            callbackFin();
            return;
        }

        this.basculerEtatFormulaireConfiguration(true);

        const BUDGET_MS = 12;
        let index = 0;

        const traiterTranche = () => {
            const debutTranche = performance.now();

            while (index < total && (performance.now() - debutTranche) < BUDGET_MS) {
                const ligne = lignesATraiter[index];
                const numLigneFichier = index + 2;

                const diagnostic = Validation.validerLigne(ligne, numLigneFichier, mappingUtilise, dateReferenceUtilisee);

                if (diagnostic.valide) {
                    this.elevesValides.push(diagnostic.donneesFormatees);
                } else {
                    const cleNomMappee = mappingUtilise['nom_eleve'];
                    this.dossiersRejetes.push({
                        ligne: numLigneFichier,
                        identifiant: ligne[cleNomMappee] || `Anonyme (Ligne ${numLigneFichier})`,
                        anomalies: diagnostic.erreurs.join(' | ')
                    });
                }
                index++;
            }

            this.mettreAJourProgression((index / total) * 90);

            if (index < total) {
                requestAnimationFrame(traiterTranche);
            } else {
                requestAnimationFrame(() => {
                    try {
                        this.rendreRapportErreurs();
                        this.mettreAJourProgression(95);

                        requestAnimationFrame(() => {
                            try {
                                this.executerClassementEtAffichage();
                                this.mettreAJourProgression(100);
                            } catch (err) {
                                alert("Une erreur inattendue est survenue lors du calcul du classement : " + err.message);
                                document.getElementById('process-actions').classList.add('hidden');
                            } finally {
                                this.traitementEnCours = false;
                                this.basculerEtatFormulaireConfiguration(false);
                                callbackFin();
                            }
                        });
                    } catch (err) {
                        alert("Une erreur inattendue est survenue lors de la génération du rapport d'erreurs : " + err.message);
                        document.getElementById('process-actions').classList.add('hidden');
                        this.traitementEnCours = false;
                        this.basculerEtatFormulaireConfiguration(false);
                        callbackFin();
                    }
                });
            }
        };

        requestAnimationFrame(traiterTranche);
    },

    basculerEtatFormulaireConfiguration(desactiver) {
        const form = document.getElementById('settings-form');
        if (!form) return;

        const elements = form.querySelectorAll('input, button');
        elements.forEach(el => {
            el.disabled = desactiver;
            if (desactiver) {
                el.style.opacity = "0.6";
                el.style.cursor = "not-allowed";
            } else {
                el.style.opacity = "1";
                el.style.cursor = "";
            }
        });
    },

    rendreRapportErreurs() {
        const sectionErreurs = document.getElementById('errors-section');
        const tbody = document.getElementById('errors-tbody');
        const countSpan = document.getElementById('error-count');

        tbody.innerHTML = '';
        countSpan.textContent = this.dossiersRejetes.length;

        if (this.dossiersRejetes.length === 0) {
            sectionErreurs.classList.add('hidden');
            return;
        }

        this.dossiersRejetes.forEach(err => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="text-center" style="color:var(--error-color); font-weight:bold;">${parseInt(err.ligne, 10)}</td>
                <td>${Utils.escapeHTML(err.identifiant)}</td>
                <td class="error-text">${Utils.escapeHTML(err.anomalies)}</td>
            `;
            tbody.appendChild(tr);
        });

        sectionErreurs.classList.remove('hidden');
    },

    executerClassementEtAffichage() {
        if (this.elevesValides.length === 0) {
            alert("Aucun élève valide n'a pu être extrait.");
            document.getElementById('results-section').classList.add('hidden');
            return;
        }

        const classementFinal = Scoring.calculerClassement(this.elevesValides, this.coefficients);
        TableManager.init(classementFinal, this.enTetesFichier, this.mappingSelectionne);

        document.getElementById('results-section').classList.remove('hidden');
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });

        const titreResultats = document.getElementById('results-title');
        if (titreResultats) {
            titreResultats.focus();
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    App.init();
});