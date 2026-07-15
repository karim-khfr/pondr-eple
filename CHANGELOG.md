# CHANGELOG.md

> **Historique des versions de Pondr**\
> Le format de ce document s'inspire de *Keep a Changelog*.

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
