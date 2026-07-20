const Parser = {
    /**
     * Analyse un fichier Excel (.xlsx) ou CSV et retourne un tableau d'objets (lignes)
     * @param {File} file 
     * @returns {Promise<Array>}
     */
    analyserFichier(file) {
        return new Promise((resolve, reject) => {
            // Vérification de la disponibilité de SheetJS avant l'import
            if (!window.XLSX) {
                reject(new Error(
                    "La bibliothèque de lecture Excel/CSV n'est pas disponible. " +
                    "Vérifiez votre connexion internet ou contactez l'administrateur."
                ));
                return;
            }

            const reader = new FileReader();
            const extension = file.name.split('.').pop().toLowerCase();

            // Si c'est un fichier Excel
            if (extension === 'xlsx') {
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target.result);
                        // IMPORTANT: On utilise le type 'array' pour lire l'ArrayBuffer de manière robuste
                        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

                        const nomPremiereFeuille = workbook.SheetNames[0];
                        const feuille = workbook.Sheets[nomPremiereFeuille];

                        // Convertit la feuille en tableau d'objets JSON
                        const lignes = XLSX.utils.sheet_to_json(feuille, { defval: '' });

                        if (lignes.length === 0) {
                            reject(new Error("Le fichier Excel est vide ou ne contient aucune ligne de données."));
                            return;
                        }
                        resolve(lignes);
                    } catch (err) {
                        reject(new Error("Erreur lors du décodage du fichier Excel : " + err.message));
                    }
                };

                reader.onerror = () => reject(new Error("Erreur physique de lecture du fichier."));
                // Lecture sous forme de buffer pour SheetJS
                reader.readAsArrayBuffer(file);

                // Si c'est un fichier CSV standard
            } else if (extension === 'csv') {
                reader.onload = (e) => {
                    try {
                        const texte = e.target.result;
                        // On délègue à SheetJS le traitement uniforme du CSV pour garder la même structure
                        const workbook = XLSX.read(texte, { type: 'string' });
                        const feuille = workbook.Sheets[workbook.SheetNames[0]];
                        const lignes = XLSX.utils.sheet_to_json(feuille, { defval: '' });

                        resolve(lignes);
                    } catch (err) {
                        reject(new Error("Erreur lors de l'analyse du fichier CSV : " + err.message));
                    }
                };
                reader.onerror = () => reject(new Error("Erreur physique de lecture du CSV."));
                reader.readAsText(file, 'UTF-8');
            } else {
                reject(new Error("Format de fichier non pris en charge. Fournissez un .xlsx ou un .csv."));
            }
        });
    }
};