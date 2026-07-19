# CHANGELOG.md

> **Historique des versions de Pondr**\
> Le format de ce document s'inspire de *Keep a Changelog*.

------------------------------------------------------------------------

## [1.5.0] - 2026-07-20

### Ajouté
- **Durcissement du pré-mapping automatique (UI) :** Implémentation d'un dictionnaire d'alias stricts (`ALIAS_DICTIONNAIRE`) limitant les correspondances automatiques aux bases SIÈCLE/Parcoursup.
- **Aperçu dynamique des données :** Affichage en temps réel des 3 premières lignes réelles sous chaque sélecteur de colonne pour validation humaine immédiate.
- **Indicateurs visuels :** Ajout d'un badge "💡 Suggestion automatique" lors d'un appariement réussi par l'algorithme.

### Corrigé & Sécurisé
- **Réévaluation intelligente (`liaisonEvenementsFormulaire`) :** 
  - Si modification de la date de référence : Réévaluation totale des lignes brutes (`validerLigne`) en arrière-plan (âges et limites de validité).
  - Si modification des coefficients seuls : Exécution instantanée du classement sans rechargement inutile du fichier.
- **Sécurisation du traitement asynchrone :** Figeage de la date de référence au démarrage du traitement par tranches pour immuniser le calcul contre les modifications à la volée du formulaire.
- **Verrouillage de l'UI :** Ajout de `basculerEtatFormulaireConfiguration(desactiver)` pour geler les interactions et sécuriser le double import de fichier.
- **Validation transactionnelle du Formulaire :** Déplacement de l'enregistrement dans le `localStorage` et dans l'état de l'application *après* validation stricte de la somme des coefficients (100 %).
- **Assainissement du `localStorage` :** Rejet des dates corrompues ou invalides et blocage des coefficients à `Infinity` au chargement initial.
- **Robustesse du cycle de vie des fichiers :**
  - Réinitialisation complète de l'état interne (`lignesBrutes`, `enTetesFichier`, input HTML à `""`) lors d'un échec de lecture dans le bloc `catch`.
  - Nettoyage du `fileInput.value` au clic/focus dans `liaisonEvenementsZoneDepot()` pour autoriser la ré-importation immédiate d'un même fichier.
- **Anti-Rebonds (Debounce) :** Blocage des clics frénétiques sur le bouton de validation du mapping via une garde `if (this.traitementEnCours) return;` positionnée en tête d'écouteur.
- **Uniformisation algorithmique :** Détermination unique des collisions d'en-têtes en amont du rendu pour garantir un schéma d'export uniformisé et éliminer les calculs redondants par élève.

### Spécifications Métier & Export
- **Régulation des coefficients :** Interdiction stricte des valeurs décimales au sein du formulaire pour éviter les approximations de notation.
- **Épuration des exports :** Retrait définitif des métadonnées globales (`coefficients` et `dateReference`) des lignes de l'export CSV pour conformité stricte du tableau.

### Accessibilité (A11y)
- **Tableaux de tri :** Initialisation de `aria-sort="none"` sur les balises `<th>`, intégration de boutons natifs dans les en-têtes et mise à jour dynamique lors du clic.
- **Accessibilité contextuelle :** Vocalisation dynamique via `aria-label` sur le conteneur de progression pour expliciter l'attente (chargement de fichier vs réévaluation des âges).

------------------------------------------------------------------------

## [1.4.1] - 2026-07-19

### Fixed
- **Correction de l'analyse boursière** : Le chiffre `"0"` est désormais correctement intercepté et associé à l'Échelon 0 (40 points) au lieu du statut non-boursier, alignant le comportement du code avec la logique métier.

------------------------------------------------------------------------

## [1.4.0] - 2026-07-19

### Ajouts (Added)
* **Tri interactif complet** : Extension des capacités de tri sur le tableau des résultats. Les utilisateurs peuvent désormais trier dynamiquement les colonnes *Statut boursier*, *Âge*, *RFR*, *Distance* et *Temps de trajet*[cite: 45, 48, 51].
* **Désambiguïsation à l'export** : Gestion des collisions de colonnes optionnelles en introduisant un registre (`Set`) local à chaque ligne. Les en-têtes identiques ou rendus identiques après traitement sont désormais automatiquement suffixés (ex: `En-tête (1)`) pour éviter tout écrasement de données[cite: 44, 50].

### Corrections (Fixed)
* **Échappement des en-têtes CSV** : Centralisation de la fonction d'encapsulation et d'échappement global au sein de l'export CSV. Les en-têtes de colonnes contenant des caractères spéciaux ou des séparateurs de champs (ex: `;`) ne décalent plus l'affichage sous Excel[cite: 36, 39, 49].
* **Validation stricte du statut boursier** : Refonte de la logique d'analyse via des expressions régulières ancrées pour interdire les faux positifs. Prise en charge stricte de 5 formats standardisés (brut, mention échelon, format complet, oui, non)[cite: 47].

### Sécurité & Intégrité (Security)
* **Verrou d'intégrité à l'export** : Sécurisation des fonctions d'exportation Excel et CSV. Les fichiers générés restituent désormais systématiquement l'ordre officiel du classement (du 1er au dernier rang), faisant abstraction des tris visuels temporaires appliqués par l'utilisateur à l'écran.

------------------------------------------------------------------------

## [1.3.2] - 2026-07-18

### Sécurisé
* **Gestion de la concurrence (Race Condition) :** Résolution d'un problème critique qui permettait de charger un nouveau fichier Excel/CSV alors qu'un traitement par tranches était déjà en cours d'exécution en arrière-plan[cite: 7].
* **Isolation des données :** Implémentation de snapshots locaux immuables (`lignesATraiter` et `mappingUtilise`) lors du lancement du traitement asynchrone[cite: 7]. Les calculs sont désormais étanches face aux interactions de l'utilisateur[cite: 7].
* **Verrouillage de l'interface :** Ajout d'un indicateur d'état global `traitementEnCours` bloquant toute tentative d'importation secondaire accidentelle tant que le classement n'est pas finalisé[cite: 7].

### Corrigé
* Prévention des risques de mélange de données confidentielles entre deux fichiers distincts[cite: 7].
* Élimination des anomalies fantômes et des rejets de dossiers injustifiés causés par la mutation des en-têtes en plein calcul[cite: 7].
* Correction des blocages potentiels du thread principal (UI) en cas d'erreurs inattendues grâce à une libération systématique du verrou dans les blocs `finally`[cite: 7].

------------------------------------------------------------------------

## [1.3.1] - 2026-07-18

### Corrigé
- **Bouton de réinitialisation :** Correction du bug qui empêchait la date de référence de revenir à sa valeur d'usine (`2026-09-01`) lors du clic sur "Réinitialiser par défaut" si l'utilisateur l'avait modifiée au préalable.

### Changé (Maintenance)
- **Architecture de configuration :** Découplage de la date active (`dateReference`) et de la date par défaut (`dateReferenceParDefaut`) au sein de l'objet global `App` pour éviter l'écrasement mutuel des données en mémoire.
- **Élimination du hardcoding :** Centralisation de la constante de temps au sommet du script afin de simplifier la bascule sur les futures campagnes d'ordonnancement (ex: Rentrée 2028) en une seule ligne de code.

------------------------------------------------------------------------

## [1.3.0] - 2026-07-18

### Évolution Majeure (Feature)
* **Date de référence dynamique pour l'âge :** Découplage complet de la date de référence du calcul de l'âge (auparavant fixée au 01/09/2026). L'application devient entièrement pérenne et configurable pour les campagnes d'affectation futures (2027, 2028, etc.).

### Ajouts et Modifications
* **Interface Graphique (`index.html`) :** Ajout d'un champ de saisie de type calendrier (`<input type="date">`) dans le formulaire de configuration pour permettre à l'administration de modifier la date à la volée.
* **Persistance (`js/app.js`) :** 
  * Initialisation d'une date de courtoisie par défaut (`2026-09-01`).
  * Sauvegarde automatique et chargement de la date personnalisée via le `localStorage` (`pond_date_ref`) pour conserver les préférences d'une session à l'autre.
  * Réinitialisation synchronisée de la date via le bouton "Réinitialiser les coefficients".
* **Moteur de Validation (`js/validation.js`) :**
  * Remplacement du calcul d'âge fixe par la méthode dynamique `Utils.calculerAgeDynamique`.
  * Dynamisation de la borne supérieure de validation (l'année maximale autorisée s'aligne automatiquement sur l'année de la date de référence configurée).
* **Traçabilité des Données (`js/export.js`) :**
  * **Export Excel :** Injection de la date de référence configurée dans un nouveau champ dédié au sein de l'onglet d'audit (`Metadonnees_Audit`).
  * **Export CSV :** Ajout de la date de référence dans les lignes de commentaires de métadonnées en en-tête du fichier.

------------------------------------------------------------------------

## [1.2.0] - 2026-07-17

### Ajouté
- Implémentation d'un filtrage et d'une validation stricte sur le 5ème critère d'évaluation (Revenu Fiscal de Référence - RFR). Les valeurs textuelles invalides ou négatives sont désormais rejetées en amont du pipeline pour protéger le moteur de calcul.

### Sécurité
- Mise à niveau de l'intégrité des sous-ressources (SRI) de SheetJS (`xlsx.full.min.js`) en passant d'un hachage SHA-256 à une clé SHA-384 robuste et vérifiée localement (`sha384-vtjasyidUo...`).
- Immunisation du script `scoring.js` contre les divisions par zéro ou les distorsions d'extremums (min/max RFR) liées à des données d'import corrompues.

------------------------------------------------------------------------

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

------------------------------------------------------------------------

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
