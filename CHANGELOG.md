# CHANGELOG.md

> **Historique des versions de Pondr**\
> Le format de ce document s'inspire de *Keep a Changelog*.

## [1.2.0] - 2026-07-17

### Ajouté
- Implémentation d'un filtrage et d'une validation stricte sur le 5ème critère d'évaluation (Revenu Fiscal de Référence - RFR). Les valeurs textuelles invalides ou négatives sont désormais rejetées en amont du pipeline pour protéger le moteur de calcul.

### Sécurité
- Mise à niveau de l'intégrité des sous-ressources (SRI) de SheetJS (`xlsx.full.min.js`) en passant d'un hachage SHA-256 à une clé SHA-384 robuste et vérifiée localement (`sha384-vtjasyidUo...`).
- Immunisation du script `scoring.js` contre les divisions par zéro ou les distorsions d'extremums (min/max RFR) liées à des données d'import corrompues.

## [1.1.1] - 2026-07-17

### Sécurité
- **Protection contre les injections CSV** : Neutralisation systématique des caractères de contrôle (`=`, `+`, `-`, `@`) au début des champs texte lors des exports Excel et CSV pour protéger le tableur de l'utilisateur final.
- **Protection XSS** : Échappement rigoureux de l'ensemble des flux de données injectés dynamiquement dans le DOM (Rapport d'erreurs, Tableau de résultats).

### Accessibilité (A11y)
- **Zone de dépôt accessible** : Transformation de la `#drop-zone` en composant focalisable au clavier (`tabindex="0"`, `role="button"`, attributs ARIA complets).
- **Navigation clavier** : Implémentation d'un écouteur `keydown` interceptant les touches `Entrée` et `Espace` pour ouvrir proprement le sélecteur de fichiers.
- **Résolution du conflit d'événements** : Suppression d'un ancien hack basé sur les coordonnées physiques de la souris (`screenX`/`screenY`) et ajout d'un `stopPropagation()` sur l'input masqué, débloquant ainsi l'ouverture du gestionnaire de fichiers au clavier.
- **Tableau interactif** : Rangement des en-têtes de colonnes triables dans l'ordre de tabulation et support du déclenchement du tri au clavier.

### Correctifs
- **Élimination de références mortes** : Suppression définitive de la constante `btnClasser` et nettoyage de son état de désactivation dans le callback de fin de traitement de `app.js` (évite une erreur fatale `TypeError: Cannot set properties of null`).
- **Contrôle d'unicité du mapping** : Validation stricte via une structure `Set` interdisant à l'utilisateur d'allouer une même colonne du fichier source à plusieurs critères applicatifs différents.
- **Durcissement des parsers** : Implémentation de Regex ciblées et de contrôles d'intégrité calendaire (`Number.isFinite`, validation stricte des jours/mois/années) pour rejeter les anomalies de saisie (ex: "15 km", dates inexistantes comme le "31 février").

### Optimisations UI/UX
- Ajout du tri interactif au clic de souris sur l'ensemble des en-têtes (`<th>`) du tableau de résultats.

## [1.1.0] - 2026-07

### Ajout
- Nouveau critère d'évaluation : **Revenu Fiscal de Référence** (RFR) avec formule de normalisation inversée (priorité aux bas revenus).
- Système de **Mapping dynamique des colonnes** à l'import : un écran intermédiaire avec des menus déroulants pour associer vos colonnes aux critères de Pondr.
- Conservation des colonnes non-associées (comme les "situations particulières") pour qu'elles s'affichent dans le tableau final et les exports.

### Modifié
- Réajustement des coefficients de pondération par défaut : Bourse (40%), Âge (20%), Distance (20%), RFR (10%), Temps (10%).
- Nouvelle cascade de tri pour les ex æquo : le RFR arbitre désormais juste après l'âge et avant la distance.

------------------------------------------------------------------------

## \[1.0.0\] - 2026-07

### Ajout

-   Première version publique de Pondr.
-   Interface web monopage (SPA).
-   Import de fichiers Excel (.xlsx) et CSV.
-   Paramétrage des coefficients de pondération.
-   Validation complète des données d'entrée.
-   Classement multicritère configurable.
-   Recherche, tri et filtrage des résultats.
-   Export Excel avec feuille d'audit.
-   Export CSV avec métadonnées.
-   Rapport détaillé des anomalies.
-   Sauvegarde locale des coefficients utilisateur.

### Algorithme

-   Normalisation des critères sur une échelle de 0 à 100.
-   Priorité configurable par pondération.
-   Gestion des ex æquo par cascade de critères.
-   Protection contre les divisions par zéro.
-   Traitement homogène des dates Excel et CSV.

### Sécurité

-   Exécution 100 % locale.
-   Aucune transmission des données vers un serveur.
-   Échappement des données affichées (protection XSS).
-   Validation systématique des entrées.

### Performance

-   Traitement incrémental via `requestAnimationFrame`.
-   Barre de progression en temps réel.
-   Optimisation pour les fichiers volumineux.

------------------------------------------------------------------------

## Versions futures

### Prévu

-   Captures d'écran dans la documentation.
-   Profils de pondération enregistrables.
-   Nouveaux critères de classement.
-   Internationalisation.
-   Amélioration des exports.
-   Journal d'audit enrichi.

------------------------------------------------------------------------

## Politique de versionnement

Pondr suit le principe du **versionnement sémantique** :

-   **MAJEUR** : changements incompatibles ;
-   **MINEUR** : nouvelles fonctionnalités compatibles ;
-   **CORRECTIF** : corrections de bugs sans modification fonctionnelle.
