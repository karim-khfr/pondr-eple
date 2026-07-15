const App = {
    version: "1.0.0",
    fichierCharge: null,
    lignesBrutes: [],
    elevesValides: [],
    dossiersRejetes: [],
    coefficients: { bourse: 45, age: 20, distance: 20, temps: 15 },

    /**
     * Initialisation globale et liaison des gestionnaires d'événements
     */
    init() {
        this.afficherVersion();
        this.chargerCoefficientsDepuisStockage();
        this.liaisonEvenementsFormulaire();
        this.liaisonEvenementsZoneDepot();
        this.liaisonEvenementsActions();
        this.liaisonEvenementsTableau();
    },

    /**
     * Injecte dynamiquement la version courante dans le footer
     */
    afficherVersion() {
        const elementVersion = document.getElementById('app-version');
        if (elementVersion) {
            // Utilisation de textContent pour des raisons de sécurité (XSS)
            elementVersion.textContent = this.version;
        }
    },

    /**
     * Restitue ou configure les pondérations initiales persistées avec validation stricte
     */
    chargerCoefficientsDepuisStockage() {
        const stock = localStorage.getItem('internat_coefficients');
        const parDefaut = { bourse: 45, age: 20, distance: 20, temps: 15 };

        if (stock) {
            try {
                const charges = JSON.parse(stock);

                // Clause de validation stricte : 4 clés numériques positives dont la somme vaut 100
                const cles = ['bourse', 'age', 'distance', 'temps'];
                const valides = cles.every(cle =>
                    typeof charges[cle] === 'number' &&
                    !isNaN(charges[cle]) &&
                    charges[cle] >= 0
                );

                const sommeCorrecte = valides && (cles.reduce((sum, cle) => sum + charges[cle], 0) === 100);

                if (valides && sommeCorrecte) {
                    this.coefficients = charges;
                } else {
                    console.warn("Coefficients invalides détectés dans le stockage local. Repli sur les valeurs par défaut.");
                    this.coefficients = parDefaut;
                    localStorage.setItem('internat_coefficients', JSON.stringify(this.coefficients));
                }
            } catch (e) {
                console.error("Erreur de lecture du localStorage, retour aux valeurs par défaut.", e);
                this.coefficients = parDefaut;
            }
        } else {
            this.coefficients = parDefaut;
        }

        // Assignation graphique
        document.getElementById('weight-bourse').value = this.coefficients.bourse;
        document.getElementById('weight-age').value = this.coefficients.age;
        document.getElementById('weight-distance').value = this.coefficients.distance;
        document.getElementById('weight-temps').value = this.coefficients.temps;
    },

    /**
     * Événements liés au formulaire de configuration des coefficients
     */
    liaisonEvenementsFormulaire() {
        const form = document.getElementById('settings-form');
        const btnReset = document.getElementById('reset-weights');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const wBourse = parseInt(document.getElementById('weight-bourse').value, 10) || 0;
            const wAge = parseInt(document.getElementById('weight-age').value, 10) || 0;
            const wDistance = parseInt(document.getElementById('weight-distance').value, 10) || 0;
            const wTemps = parseInt(document.getElementById('weight-temps').value, 10) || 0;

            if (wBourse < 0 || wAge < 0 || wDistance < 0 || wTemps < 0 || (wBourse + wAge + wDistance + wTemps) !== 100) {
                alert("Erreur critique : La somme des coefficients doit être strictement égale à 100% et chaque valeur doit être positive.\nActuel : " + (wBourse + wAge + wDistance + wTemps) + "%");
                return;
            }

            this.coefficients = { bourse: wBourse, age: wAge, distance: wDistance, temps: wTemps };
            localStorage.setItem('internat_coefficients', JSON.stringify(this.coefficients));
            alert("Les coefficients ont été enregistrés avec succès.");

            if (this.elevesValides.length > 0) {
                this.executerClassementEtAffichage();
            }
        });

        btnReset.addEventListener('click', () => {
            document.getElementById('weight-bourse').value = 45;
            document.getElementById('weight-age').value = 20;
            document.getElementById('weight-distance').value = 20;
            document.getElementById('weight-temps').value = 15;
            form.requestSubmit();
        });
    },

    liaisonEvenementsZoneDepot() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');

            if (e.dataTransfer.files.length > 0) {
                this.traiterFichierSelectionne(e.dataTransfer.files[0]);
            }
        });

        dropZone.addEventListener('click', (e) => {
            if (e.screenX === 0 && e.screenY === 0 && e.detail === 0) {
                e.preventDefault();
                return;
            }
            if (e.target !== fileInput) {
                fileInput.click();
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.traiterFichierSelectionne(e.target.files[0]);
            }
        });

        dropZone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInput.click();
            }
        });
    },

    async traiterFichierSelectionne(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext !== 'xlsx' && ext !== 'csv') {
            alert("Format non valide. Veuillez importer un fichier Microsoft Excel (.xlsx) ou un fichier plat CSV.");
            return;
        }

        this.fichierCharge = file;
        const fileInfo = document.getElementById('file-info');
        fileInfo.innerHTML = `Fichier sélectionné : ${Utils.escapeHTML(file.name)} (${(file.size / 1024).toFixed(1)} Ko)`;
        fileInfo.classList.remove('hidden');

        try {
            this.lignesBrutes = await Parser.analyserFichier(file);
            document.getElementById('process-actions').classList.remove('hidden');
            document.getElementById('errors-section').classList.add('hidden');
            document.getElementById('results-section').classList.add('hidden');
        } catch (err) {
            alert(err.message);
        }
    },

    liaisonEvenementsActions() {
        const btnClasser = document.getElementById('btn-classer');
        const progressContainer = document.getElementById('progress-container');

        btnClasser.addEventListener('click', () => {
            if (this.lignesBrutes.length === 0) {
                alert("Aucune donnée disponible à traiter.");
                return;
            }

            btnClasser.disabled = true;
            progressContainer.classList.remove('hidden');
            this.mettreAJourProgression(0);

            this.lancerTraitementParTranches(() => {
                btnClasser.disabled = false;
            });
        });

        document.getElementById('btn-export-excel').addEventListener('click', (e) => {
            if (e.currentTarget.disabled) return;
            ExportManager.exporterVersExcel(TableManager.donneesFiltrees, this.coefficients);
        });

        document.getElementById('btn-export-csv').addEventListener('click', (e) => {
            if (e.currentTarget.disabled) return;
            ExportManager.exporterVersCSV(TableManager.donneesFiltrees, this.coefficients);
        });
    },

    /**
     * Écoute les entrées utilisateur pour filtrer le tableau en temps réel
     */
    liaisonEvenementsTableau() {
        const searchInput = document.getElementById('search-input');
        const filterBourse = document.getElementById('filter-bourse');

        if (searchInput && filterBourse) {
            // Événement sur la saisie de texte (recherche par nom)
            searchInput.addEventListener('input', () => {
                TableManager.filtrer(searchInput.value, filterBourse.value);
            });

            // Événement sur le changement de filtre boursier
            filterBourse.addEventListener('change', () => {
                TableManager.filtrer(searchInput.value, filterBourse.value);
            });
        }
    },

    /**
     * Met à jour visuellement la barre de progression (0-100) et son attribut ARIA
     */
    mettreAJourProgression(pourcentage) {
        const progressContainer = document.getElementById('progress-container');
        const progressBar = document.getElementById('progress-bar');
        const arrondi = Math.min(100, Math.max(0, Math.round(pourcentage)));

        progressBar.style.width = `${arrondi}%`;
        progressBar.textContent = `${arrondi}%`;
        progressContainer.setAttribute('aria-valuenow', arrondi);
    },

    /**
     * Traite les lignes brutes par tranches temporelles (budget ~12ms par image)
     * via requestAnimationFrame, afin de garder l'interface réactive et d'afficher
     * une progression reflétant le travail réellement effectué, y compris sur les
     * fichiers volumineux.
     */
    lancerTraitementParTranches(callbackFin) {
        this.elevesValides = [];
        this.dossiersRejetes = [];

        const total = this.lignesBrutes.length;

        if (total === 0) {
            callbackFin();
            return;
        }

        const premierObjet = this.lignesBrutes[0];
        const verifEntetes = Validation.validerEntetes(Object.keys(premierObjet));

        if (!verifEntetes.valide) {
            alert(`Erreur d'en-tête critique. Le fichier ne contient pas les colonnes obligatoires requises.\nColonnes manquantes : ${verifEntetes.colonnesManquantes.join(', ')}`);
            document.getElementById('progress-container').classList.add('hidden');
            callbackFin();
            return;
        }

        const BUDGET_MS = 12; // temps de calcul alloué par image (~ garde l'UI fluide)
        let index = 0;

        const traiterTranche = () => {
            const debutTranche = performance.now();

            while (index < total && (performance.now() - debutTranche) < BUDGET_MS) {
                const ligne = this.lignesBrutes[index];
                const numLigneFichier = index + 2;
                const diagnostic = Validation.validerLigne(ligne, numLigneFichier);

                if (diagnostic.valide) {
                    this.elevesValides.push(diagnostic.donneesFormatees);
                } else {
                    this.dossiersRejetes.push({
                        ligne: numLigneFichier,
                        identifiant: ligne['nom_eleve'] || ligne['Nom_Eleve'] || `Anonyme (Ligne ${numLigneFichier})`,
                        anomalies: diagnostic.erreurs.join(' | ')
                    });
                }

                index++;
            }

            // La validation ligne à ligne représente 90% de la progression affichée ;
            // les 10% restants couvrent le calcul du classement et le rendu du tableau.
            this.mettreAJourProgression((index / total) * 90);

            if (index < total) {
                requestAnimationFrame(traiterTranche);
            } else {
                requestAnimationFrame(() => {
                    this.rendreRapportErreurs();
                    this.mettreAJourProgression(95);

                    requestAnimationFrame(() => {
                        this.executerClassementEtAffichage();
                        this.mettreAJourProgression(100);
                        callbackFin();
                    });
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
            alert("Aucun élève valide n'a pu être extrait. Impossible de générer un classement.");
            document.getElementById('results-section').classList.add('hidden');
            return;
        }

        const classementFinal = Scoring.calculerClassement(this.elevesValides, this.coefficients);
        TableManager.init(classementFinal);

        document.getElementById('results-section').classList.remove('hidden');
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
    }
};

// INITIALISATION AU CHARGEMENT DE LA PAGE
document.addEventListener("DOMContentLoaded", () => {
    App.init();
});