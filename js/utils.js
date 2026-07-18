/**
 * Outils et utilitaires transverses
 */
const Utils = {
    /**
     * Échappe les caractères HTML sensibles pour prévenir les failles XSS
     * @param {any} val Valeur à sécuriser
     * @returns {string} Chaîne sécurisée
     */
    escapeHTML(val) {
        if (val === undefined || val === null) return '';
        return String(val)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }, // <-- ATTENTION À CETTE VIRGULE OBLIGATOIRE

    /**
 * Calcule l'âge exact par rapport à une date de référence dynamique
 * @param {string|Date} dateNaissance 
 * @param {string} dateRefString Format "YYYY-MM-DD"
 * @returns {number} Âge sous forme d'entier
 */
    calculerAgeDynamique(dateNaissance, dateRefString) {
        const dateRef = new Date(dateRefString);
        let dateNais = new Date(dateNaissance);

        if (isNaN(dateNais.getTime()) || isNaN(dateRef.getTime())) {
            throw new Error("Format de date invalide");
        }

        let age = dateRef.getFullYear() - dateNais.getFullYear();
        const moisDiff = dateRef.getMonth() - dateNais.getMonth();
        const jourDiff = dateRef.getDate() - dateNais.getDate();

        if (moisDiff < 0 || (moisDiff === 0 && jourDiff < 0)) {
            age--;
        }
        return age;
    }, // <-- ATTENTION À CETTE VIRGULE OBLIGATOIRE

    /**
     * Normalise les chaînes de caractères pour les comparaisons et nettoyages
     * @param {string} str 
     * @returns {string} Cleaned string
     */
    cleanString(str) {
        if (!str) return '';
        return String(str).trim().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }, // <-- ATTENTION À CETTE VIRGULE OBLIGATOIRE

    /**
     * Formate une date au standard lisible français DD/MM/YYYY
     * @param {string} isoString 
     * @returns {string} Formatted date
     */
    formatDateFr(isoString) {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return String(isoString);
        return d.toLocaleDateString('fr-FR');
    }, // <-- ATTENTION À CETTE VIRGULE OBLIGATOIRE

    /**
     * Génère l'horodatage pour les noms de fichiers exportés YYYY-MM-DD_HH-mm
     * @returns {string} Timestamp formaté
     */
    getTimestampForFilename() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}`;
        return `${datePart}_${timePart}`;
    }
};