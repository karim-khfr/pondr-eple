const TableManager = {
    donneesInitiales: [],
    donneesFiltrees: [],
    enTetesFichierBruts: [],
    mappingSelectionne: {},
    triActuel: { colonne: 'rang', ordre: 'asc' },
    filtreBourse: 'all',
    rechercheTerme: '',

    init(data, enTetesBruts = [], mapping = {}) {
        this.donneesInitiales = [...data];
        this.donneesFiltrees = [...data];
        this.enTetesFichierBruts = enTetesBruts;
        this.mappingSelectionne = mapping;
        this.triActuel = { colonne: 'rang', ordre: 'asc' };

        // Reconstruction dynamique des en-têtes optionnels (non mappés) du tableau
        this.ajusterColonnesHorsMappingTh();
        this.appliquerFiltresEtRendu();
    },

    /**
     * Ajoute dynamiquement des en-têtes de colonnes optionnels pour les données non mappées
     */
    ajusterColonnesHorsMappingTh() {
        const resultsTable = document.getElementById('results-table');
        if (!resultsTable) return;

        // Nettoyer les éventuelles colonnes dynamiques précédentes
        const thsDynamiques = resultsTable.querySelectorAll('th.dyn-extra-col');
        thsDynamiques.forEach(th => th.remove());

        const theadRow = resultsTable.querySelector('thead tr');
        const clesMappees = Object.values(this.mappingSelectionne);

        this.enTetesFichierBruts.forEach(header => {
            if (!clesMappees.includes(header)) {
                const th = document.createElement('th');
                th.scope = "col";
                th.className = "dyn-extra-col";
                th.style.backgroundColor = "#eef4f9"; // Légère démarcation visuelle
                th.textContent = header;
                theadRow.appendChild(th);
            }
        });
    },

    filtrer(terme, statutBourse) {
        this.rechercheTerme = Utils.cleanString(terme);
        this.filtreBourse = statutBourse;
        this.appliquerFiltresEtRendu();
    },

    appliquerFiltresEtRendu() {
        this.donneesFiltrees = this.donneesInitiales.filter(item => {
            const matchRecherche = !this.rechercheTerme ||
                Utils.cleanString(item.nom_eleve).includes(this.rechercheTerme);

            let matchBourse = true;
            if (this.filtreBourse === 'boursier') {
                matchBourse = item.echelonBourse >= 0;
            } else if (this.filtreBourse === 'non-boursier') {
                matchBourse = item.echelonBourse === -1;
            }

            return matchRecherche && matchBourse;
        });

        const estFiltre = this.rechercheTerme !== '' || this.filtreBourse !== 'all';
        const warningBanner = document.getElementById('filter-warning');
        const btnExcel = document.getElementById('btn-export-excel');
        const btnCsv = document.getElementById('btn-export-csv');

        if (estFiltre) {
            warningBanner.classList.remove('hidden');
            btnExcel.disabled = true;
            btnCsv.disabled = true;
            btnExcel.style.opacity = "0.5";
            btnExcel.style.cursor = "not-allowed";
            btnCsv.style.opacity = "0.5";
            btnCsv.style.cursor = "not-allowed";
        } else {
            warningBanner.classList.add('hidden');
            btnExcel.disabled = false;
            btnCsv.disabled = false;
            btnExcel.style.opacity = "1";
            btnExcel.style.cursor = "pointer";
            btnCsv.style.opacity = "1";
            btnCsv.style.cursor = "pointer";
        }

        this.trier(this.triActuel.colonne, true);
    },

    trier(cleColonne, forcerRenduEviterBascule = false) {
        if (!forcerRenduEviterBascule) {
            if (this.triActuel.colonne === cleColonne) {
                this.triActuel.ordre = this.triActuel.ordre === 'asc' ? 'desc' : 'asc';
            } else {
                this.triActuel.colonne = cleColonne;
                this.triActuel.ordre = 'asc';
            }
        }

        const multiplicateur = this.triActuel.ordre === 'asc' ? 1 : -1;

        this.donneesFiltrees.sort((a, b) => {
            let valA, valB;

            switch (cleColonne) {
                case 'rang': valA = a.rang; valB = b.rang; break;
                case 'nom': valA = a.nom_eleve; valB = b.nom_eleve; break;
                case 'score': valA = a.scoreGlobal; valB = b.scoreGlobal; break;
                case 'sBourse': valA = a.scoreBourse; valB = b.scoreBourse; break;
                case 'sAge': valA = a.scoreAge; valB = b.scoreAge; break;
                case 'sRfr': valA = a.scoreRfr; valB = b.scoreRfr; break;
                case 'sDistance': valA = a.scoreDistance; valB = b.scoreDistance; break;
                case 'sTemps': valA = a.scoreTemps; valB = b.scoreTemps; break;
                default: valA = a.rang; valB = b.rang;
            }

            if (typeof valA === 'string') {
                return valA.localeCompare(valB, 'fr') * multiplicateur;
            }
            return (valA - valB) * multiplicateur;
        });

        this.rendreBalisesEnTetes(cleColonne);
        this.rendreCorpsTableau();
    },

    rendreBalisesEnTetes(cleColonne) {
        const ths = document.querySelectorAll('#results-table th[data-sort]');
        ths.forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.getAttribute('data-sort') === cleColonne) {
                th.classList.add(this.triActuel.ordre === 'asc' ? 'sort-asc' : 'sort-desc');
            }
        });
    },

    rendreCorpsTableau() {
        const tbody = document.getElementById('results-tbody');
        tbody.innerHTML = '';

        // Détection du nombre exact de colonnes pour l'affichage du message vide
        const standardColCount = 13;
        const clesMappees = Object.values(this.mappingSelectionne);
        const colonnesHorsMappingCount = this.enTetesFichierBruts.filter(h => !clesMappees.includes(h)).length;
        const totalColCount = standardColCount + colonnesHorsMappingCount;

        if (this.donneesFiltrees.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${totalColCount}" class="text-center" style="padding:2rem; color:var(--text-muted);">Aucun dossier ne correspond aux critères de recherche actuels.</td></tr>`;
            return;
        }

        this.donneesFiltrees.forEach(e => {
            const tr = document.createElement('tr');

            // Constitution de la ligne avec les 13 colonnes standards de base (sécurisation HTML stricte)
            let innerHTML = `
                <td class="text-center"><strong>${parseInt(e.rang, 10)}</strong></td>
                <td>${Utils.escapeHTML(e.nom_eleve)}</td>
                <td class="text-right"><strong>${e.scoreGlobal.toFixed(2)}</strong></td>
                <td class="text-right" style="color:#444;">${e.scoreBourse.toFixed(2)}</td>
                <td class="text-right" style="color:#444;">${e.scoreAge.toFixed(2)}</td>
                <td class="text-right" style="color:#2b3e50; font-weight:600;">${e.scoreRfr.toFixed(2)}</td>
                <td class="text-right" style="color:#444;">${e.scoreDistance.toFixed(2)}</td>
                <td class="text-right" style="color:#444;">${e.scoreTemps.toFixed(2)}</td>
                <td>${Utils.escapeHTML(e.boursier)}</td>
                <td class="text-center">${parseInt(e.age, 10)} ans</td>
                <td class="text-right" style="font-weight:600;">${parseFloat(e.rfr_parents).toLocaleString('fr-FR')} €</td>
                <td class="text-right">${parseFloat(e.distance_km)}</td>
                <td class="text-right">${parseInt(e.temps_trajet_min, 10)}</td>
            `;

            // Injection dynamique des métadonnées optionnelles non associées de l'élève
            this.enTetesFichierBruts.forEach(header => {
                if (!clesMappees.includes(header)) {
                    const rawVal = e.metadonnees_hors_mapping[header];
                    innerHTML += `<td style="color:#555; background-color:#fcfdfe;">${Utils.escapeHTML(rawVal)}</td>`;
                }
            });

            tr.innerHTML = innerHTML;
            tbody.appendChild(tr);
        });
    }
};