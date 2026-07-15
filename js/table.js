const TableManager = {
    donneesInitiales: [],
    donneesFiltrees: [],
    triActuel: { colonne: 'rang', ordre: 'asc' },
    filtreBourse: 'all',
    rechercheTerme: '',

    init(data) {
        this.donneesInitiales = [...data];
        this.donneesFiltrees = [...data];
        this.triActuel = { colonne: 'rang', ordre: 'asc' };
        this.appliquerFiltresEtRendu();
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

        // --- GESTION DU BANDEAU ET DES BOUTONS D'EXPORT ---
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

    /**
     * Génère l'arbre HTML en sécurisant l'injection des variables utilisateur
     */
    rendreCorpsTableau() {
        const tbody = document.getElementById('results-tbody');
        tbody.innerHTML = '';

        if (this.donneesFiltrees.length === 0) {
            tbody.innerHTML = `<tr><td colspan="11" class="text-center" style="padding:2rem; color:var(--text-muted);">Aucun dossier ne correspond aux critères de recherche actuels.</td></tr>`;
            return;
        }

        this.donneesFiltrees.forEach(e => {
            const tr = document.createElement('tr');

            // Sécurisation stricte de toutes les données textuelles utilisateur
            tr.innerHTML = `
                <td class="text-center"><strong>${parseInt(e.rang, 10)}</strong></td>
                <td>${Utils.escapeHTML(e.nom_eleve)}</td>
                <td class="text-right"><strong>${e.scoreGlobal.toFixed(2)}</strong></td>
                <td class="text-right" style="color:#444;">${e.scoreBourse.toFixed(2)}</td>
                <td class="text-right" style="color:#444;">${e.scoreAge.toFixed(2)}</td>
                <td class="text-right" style="color:#444;">${e.scoreDistance.toFixed(2)}</td>
                <td class="text-right" style="color:#444;">${e.scoreTemps.toFixed(2)}</td>
                <td>${Utils.escapeHTML(e.boursier)}</td>
                <td class="text-center">${parseInt(e.age, 10)} ans</td>
                <td class="text-right">${parseFloat(e.distance_km)}</td>
                <td class="text-right">${parseInt(e.temps_trajet_min, 10)}</td>
            `;
            tbody.appendChild(tr);
        });
    }
};