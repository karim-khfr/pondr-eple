/**
 * Outils et utilitaires transverses
 */
const Utils = {
    /**
     * Analyse de manière déterministe une chaîne YYYY-MM-DD en ignorant les décalages UTC
     * @param {string} isoString 
     * @returns {Date|null}
     */
    parseDateLocale(isoString) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoString);
        if (!match) return null;

        return new Date(
            Number(match[1]),
            Number(match[2]) - 1, // Les mois de l'objet Date vont de 0 à 11
            Number(match[3]),
            12 // Sécurisation à midi pour absorber les fuseaux horaires
        );
    },

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
        // Utilisation de notre parseur local déterministe pour la date de référence
        const dateRef = Utils.parseDateLocale(dateRefString);

        // Si dateNaissance est déjà un objet Date (transmis par le Parser), on l'utilise, sinon on la parse
        let dateNais = (dateNaissance instanceof Date) ? dateNaissance : Utils.parseDateLocale(dateNaissance);

        if (!dateNais || !dateRef || isNaN(dateNais.getTime()) || isNaN(dateRef.getTime())) {
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
        if (!isoString) return '';
        const d = Utils.parseDateLocale(String(isoString).split('T')[0]);
        if (!d || isNaN(d.getTime())) return String(isoString);
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