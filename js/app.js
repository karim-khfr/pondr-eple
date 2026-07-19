const App = {
    version: "1.4.0",
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
                const valides = cles.every(cle =>
                    typeof charges[cle] === 'number' &&
                    !isNaN(charges[cle]) &&
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

        this.dateReference = localStorage.getItem('pond_date_ref') || this.dateReferenceParDefaut;
        document.getElementById('config-date-ref').value = this.dateReference;
    },

    liaisonEvenementsFormulaire() {
        const form = document.getElementById('settings-form');
        const btnReset = document.getElementById('reset-weights');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const wBourse = parseInt(document.getElementById('weight-bourse').value, 10) || 0;
            const wAge = parseInt(document.getElementById('weight-age').value, 10) || 0;
            const wDistance = parseInt(document.getElementById('weight-distance').value, 10) || 0;
            const wRfr = parseInt(document.getElementById('weight-rfr').value, 10) || 0;
            const wTemps = parseInt(document.getElementById('weight-temps').value, 10) || 0;

            // Lors du 'submit' du formulaire
            const nouvelleDate = document.getElementById('config-date-ref').value;
            if (!nouvelleDate) {
                alert("Veuillez spécifier une date de référence valide.");
                return;
            }
            this.dateReference = nouvelleDate;
            localStorage.setItem('pond_date_ref', nouvelleDate);

            const total = wBourse + wAge + wDistance + wRfr + wTemps;
            if (wBourse < 0 || wAge < 0 || wDistance < 0 || wRfr < 0 || wTemps < 0 || total !== 100) {
                alert(`Erreur critique : La somme des coefficients doit être strictement égale à 100%.\nActuel : ${total}%`);
                return;
            }

            this.coefficients = { bourse: wBourse, age: wAge, distance: wDistance, rfr: wRfr, temps: wTemps };
            localStorage.setItem('internat_coefficients_v2', JSON.stringify(this.coefficients));
            alert("Les coefficients ont été enregistrés avec succès.");

            if (this.elevesValides.length > 0) {
                this.executerClassementEtAffichage();
            }
        });

        btnReset.addEventListener('click', () => {
            document.getElementById('weight-bourse').value = 40;
            document.getElementById('weight-age').value = 20;
            document.getElementById('weight-distance').value = 20;
            document.getElementById('weight-rfr').value = 10;
            document.getElementById('weight-temps').value = 10;
            document.getElementById('config-date-ref').value = App.dateReferenceParDefaut;

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
            // On ne déclenche le clic sur l'input que si le clic ne vient pas de l'input lui-même
            if (e.target !== fileInput) {
                fileInput.click();
            }
        });

        // 3. On empêche le clic de l'input de remonter à la dropZone
        // Cela évite que le parent n'intercepte et n'annule l'ouverture de l'explorateur
        fileInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // 4. Gestion de l'Accessibilité Clavier
        dropZone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); // Évite que la barre d'espace ne fasse défiler la page
                fileInput.click();  // Déclenche l'explorateur de fichiers de manière propre
            }
        });

        // 5. Écoute du changement de fichier (quand l'utilisateur a choisi son Excel/CSV)
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.traiterFichierSelectionne(e.target.files[0]);
            }
        });
    },

    // CORRECTIF AUDIT (M5) : taille maximale acceptée pour un fichier importé (10 Mo),
    // afin d'éviter qu'un fichier volumineux ou corrompu ne gèle l'onglet du navigateur.
    TAILLE_MAX_FICHIER_OCTETS: 10 * 1024 * 1024,

    async traiterFichierSelectionne(file) {

        // Sécurité contre le double import
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

        this.fichierCharge = file;
        const fileInfo = document.getElementById('file-info');
        fileInfo.innerHTML = `Fichier sélectionné : ${Utils.escapeHTML(file.name)} (${(file.size / 1024).toFixed(1)} Ko)`;
        fileInfo.classList.remove('hidden');

        try {
            this.lignesBrutes = await Parser.analyserFichier(file);
            this.enTetesFichier = Object.keys(this.lignesBrutes[0] || {});

            if (this.enTetesFichier.length === 0) {
                throw new Error("Le fichier importé ne contient aucune donnée.");
            }

            // Affichage de l'écran de mapping dynamique et masquage temporaire de la drop zone
            document.getElementById('drop-zone').classList.add('hidden');
            this.genererInterfaceMapping();

            document.getElementById('process-actions').classList.add('hidden');
            document.getElementById('errors-section').classList.add('hidden');
            document.getElementById('results-section').classList.add('hidden');
        } catch (err) {
            alert(err.message);
        }
    },

    /**
     * Génère dynamiquement l'écran intermédiaire de sélection de correspondance des colonnes
     */
    genererInterfaceMapping() {
        const container = document.getElementById('mapping-container');
        const selectorsGrid = document.getElementById('mapping-selectors-grid');
        selectorsGrid.innerHTML = '';
        this.mappingSelectionne = {}; // Réinitialisation systématique à chaque import

        Object.entries(Validation.ATTENDUS_OBLIGATOIRES).forEach(([cleApplicative, label]) => {
            const divGroup = document.createElement('div');
            divGroup.className = 'control-group';

            const select = document.createElement('select');
            select.id = `map-${cleApplicative}`;
            select.style.width = "100%";

            // CORRECTIF AUDIT (M3) : association explicite label/select via l'attribut "for",
            // indispensable pour que les lecteurs d'écran annoncent le nom du critère au focus.
            const labelEl = document.createElement('label');
            labelEl.textContent = label + " :";
            labelEl.style.fontWeight = "600";
            labelEl.setAttribute('for', select.id);

            // Option par défaut vide
            const optDefault = document.createElement('option');
            optDefault.value = "";
            optDefault.textContent = "-- Choisissez une colonne --";
            select.appendChild(optDefault);

            // Remplissage avec les en-têtes détectés dans le fichier
            this.enTetesFichier.forEach(header => {
                const opt = document.createElement('option');
                opt.value = header;
                opt.textContent = header;
                select.appendChild(opt);
            });

            divGroup.appendChild(labelEl);
            divGroup.appendChild(select);
            selectorsGrid.appendChild(divGroup);

            // Pré-sélection intelligente insensible à la casse, accents, tirets , underscores et alias
            const targetNorm = Utils.cleanString(cleApplicative).replace(/_/g, '').replace(/kilome|km/g, '').replace(/minute|min/g, '');
            let correspondanceTrouvee = "";

            for (const header of this.enTetesFichier) {
                const headerNorm = Utils.cleanString(header).replace(/_|-|\s/g, '').replace(/kilome|km/g, '').replace(/minute|min/g, '');

                // RAPPROCHEMENT SPÉCIFIQUE POUR LE RFR (Si la colonne contient "rfr" ou "revenu" ou "fiscal")
                if (cleApplicative === 'rfr_parents' && (headerNorm.includes('revenu') || headerNorm.includes('fiscal') || headerNorm.includes('rfr'))) {
                    correspondanceTrouvee = header;
                    break;
                }

                if (headerNorm.includes(targetNorm) || targetNorm.includes(headerNorm)) {
                    correspondanceTrouvee = header;
                    break;
                }
            }

            if (correspondanceTrouvee) {
                select.value = correspondanceTrouvee;
            }
        });

        container.classList.remove('hidden');
    },

    liaisonEvenementsActions() {
        const btnValiderMapping = document.getElementById('btn-valider-mapping');
        const progressContainer = document.getElementById('progress-container');

        // Validation finale des liaisons par l'utilisateur
        btnValiderMapping.addEventListener('click', () => {
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

            // -Contrôle d'unicité des colonnes mappées
            const colonnesChoisies = Object.values(mappingTemporaire);
            const ensembleUnique = new Set(colonnesChoisies);
            if (ensembleUnique.size !== colonnesChoisies.length) {
                alert("Erreur de configuration : Chaque colonne de votre fichier ne peut être associée qu'à un seul critère.");
                return;
            }
            // -----------------------------------------------------------------

            this.mappingSelectionne = mappingTemporaire;

            // On masque l'écran de mapping, on ré-affiche la drop zone et on lance le traitement
            document.getElementById('mapping-container').classList.add('hidden');
            document.getElementById('drop-zone').classList.remove('hidden');

            document.getElementById('process-actions').classList.remove('hidden');
            progressContainer.classList.remove('hidden');
            this.mettreAJourProgression(0);

            this.lancerTraitementParTranches(() => {
                document.getElementById('process-actions').classList.add('hidden');
            });
        });

        document.getElementById('btn-export-excel').addEventListener('click', (e) => {
            if (e.currentTarget.disabled) return;

            // On crée une copie triée strictement par le rang officiel pour l'export
            const classementOfficiel = [...TableManager.donneesFiltrees]
                .sort((a, b) => a.rang - b.rang);

            ExportManager.exporterVersExcel(classementOfficiel, this.coefficients, this.enTetesFichier, this.mappingSelectionne, this.dateReference);
        });

        document.getElementById('btn-export-csv').addEventListener('click', (e) => {
            if (e.currentTarget.disabled) return;

            // On crée une copie triée strictement par le rang officiel pour l'export
            const classementOfficiel = [...TableManager.donneesFiltrees]
                .sort((a, b) => a.rang - b.rang);

            ExportManager.exporterVersCSV(classementOfficiel, this.coefficients, this.enTetesFichier, this.mappingSelectionne, this.dateReference);
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
        // Branchement du tri interactif au clic sur les th
        document.querySelectorAll('#results-table th[data-sort]').forEach(th => {
            th.style.cursor = 'pointer'; // Rendre le curseur explicite
            th.setAttribute('tabindex', '0'); // Accessibilité au clavier

            const executerTri = () => {
                TableManager.trier(th.dataset.sort);
            };

            th.addEventListener('click', executerTri);
            th.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    executerTri();
                }
            });
        });
    },

    mettreAJourProgression(pourcentage) {
        const progressContainer = document.getElementById('progress-container');
        const progressBar = document.getElementById('progress-bar');
        const arrondi = Math.min(100, Math.max(0, Math.round(pourcentage)));

        progressBar.style.width = `${arrondi}%`;
        progressBar.textContent = `${arrondi}%`;
        progressContainer.setAttribute('aria-valuenow', arrondi);
    },

    lancerTraitementParTranches(callbackFin) {
        this.elevesValides = [];
        this.dossiersRejetes = [];

        // Enclenchement du verrou et création des snapshots immuables
        this.traitementEnCours = true;
        const lignesATraiter = [...this.lignesBrutes];
        const mappingUtilise = { ...this.mappingSelectionne };
        const total = lignesATraiter.length;

        if (total === 0) {
            this.traitementEnCours = false; // Libération si vide
            callbackFin();
            return;
        }

        const BUDGET_MS = 12;
        let index = 0;

        const traiterTranche = () => {
            const debutTranche = performance.now();

            // Utilisation exclusive du snapshot local "lignesATraiter" au lieu de "this.lignesBrutes"
            while (index < total && (performance.now() - debutTranche) < BUDGET_MS) {
                const ligne = lignesATraiter[index];
                const numLigneFichier = index + 2;

                // Utilisation exclusive de "mappingUtilise" au lieu de "this.mappingSelectionne"
                const diagnostic = Validation.validerLigne(ligne, numLigneFichier, mappingUtilise);

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
                                // Libération de l'application
                                this.traitementEnCours = false;
                                callbackFin();
                            }
                        });
                    } catch (err) {
                        alert("Une erreur inattendue est survenue lors de la génération du rapport d'erreurs : " + err.message);
                        document.getElementById('process-actions').classList.add('hidden');
                        // Libération de l'application en cas d'échec
                        this.traitementEnCours = false;
                        callbackFin();
                    }
                });
            }
        };

        requestAnimationFrame(traiterTranche);
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
        // On passe les métadonnées et en-têtes à TableManager pour affichage dynamique des colonnes non mappées
        TableManager.init(classementFinal, this.enTetesFichier, this.mappingSelectionne);

        document.getElementById('results-section').classList.remove('hidden');
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });

        // CORRECTIF AUDIT (M4) : déplacement du focus réel (pas seulement visuel) vers le titre
        // des résultats, pour les utilisateurs au clavier ou en lecteur d'écran.
        const titreResultats = document.getElementById('results-title');
        if (titreResultats) {
            titreResultats.focus();
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    App.init();
});