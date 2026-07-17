# GUIDE_UTILISATEUR.md

> **Pondr -- Guide utilisateur**\
> Version 1.1.0 --- © 2026 Karim Khenifer

# Introduction

Ce guide explique l'utilisation quotidienne de Pondr pour produire un
classement multicritère à partir d'un fichier Excel ou CSV.

------------------------------------------------------------------------

# 1. Prérequis

-   Un navigateur moderne (Edge, Firefox, Chrome...)
-   Le fichier `index.html` et l'ensemble des fichiers du projet
-   Un fichier de données au format `.xlsx` ou `.csv`

Aucune installation ni serveur web n'est nécessaire.

------------------------------------------------------------------------

# 2. Démarrage

Ouvrez simplement le fichier `index.html`.

L'application s'exécute entièrement dans votre navigateur.

------------------------------------------------------------------------

# 3. Configuration des coefficients

Les coefficients déterminent le poids de chaque critère.

Par défaut :

  Critère      Valeur
  ---------- --------
  Bourse         40 %
  Âge            20 %
  RFR            10 %
  Distance       20 %
  Temps          10 %

La somme doit impérativement être égale à **100 %**.

Cliquez sur **Enregistrer les coefficients** pour les appliquer.

------------------------------------------------------------------------

# 4. Import d'un fichier

Deux méthodes sont disponibles :

-   glisser-déposer du fichier ;
-   bouton **Parcourir**.

Formats acceptés :

-   Excel (.xlsx)
-   CSV (.csv)

Après import, le nom du fichier apparaît sous la zone de dépôt.

## Étape intermédiaire : Correspondance des colonnes (Mapping)
Dès l'importation de votre fichier, un écran intermédiaire s'affiche. Cet écran vous permet d'associer les en-têtes de colonnes de votre propre fichier aux attendus de Pondr :
1. Pour chaque critère requis (Nom, Date de naissance, Statut boursier, Distance famille, Temps de trajet, RFR), sélectionnez la colonne correspondante de votre fichier à l'aide des menus déroulants.
2. L'application pré-sélectionne automatiquement les colonnes s'il y a des correspondances évidentes.
3. Les colonnes non associées (ex: "Situation particulière", "Prénom") seront conservées de manière invisible pour le calcul, mais réapparaîtront dans le tableau de résultats final et les exports.
4. Cliquez sur **Valider les correspondances et lancer** pour confirmer.

------------------------------------------------------------------------

# 5. Lancer le classement

Cliquez sur **Lancer le Classement Automatique**.

Une barre de progression indique l'avancement du traitement.

------------------------------------------------------------------------

# 6. Rapport de conformité

Si certaines lignes sont invalides, elles sont listées dans le rapport
d'anomalies avec :

-   le numéro de ligne ;
-   l'identifiant de l'élève ;
-   la description de l'erreur.

Les lignes rejetées ne participent jamais au calcul.

------------------------------------------------------------------------

# 7. Consultation des résultats

Le tableau affiche notamment :

-   le rang ;
-   le nom ;
-   le score global ;
-   les scores par critère ;
-   les données d'origine.

Les colonnes peuvent être triées.

------------------------------------------------------------------------

# 8. Recherche et filtres

Vous pouvez :

-   rechercher un élève par son nom ;
-   filtrer les boursiers ;
-   filtrer les non-boursiers.

Lorsque des filtres sont actifs, les exports sont volontairement
désactivés afin d'éviter un export partiel.

------------------------------------------------------------------------

# 9. Export

Deux formats sont disponibles :

## Excel

Le fichier contient :

-   le classement ;
-   une feuille d'audit (date, coefficients utilisés).

## CSV

Le fichier contient :

-   les métadonnées ;
-   les données du classement.

------------------------------------------------------------------------

# 10. Bonnes pratiques

-   Vérifier les intitulés des colonnes.
-   Contrôler le rapport d'anomalies.
-   Vérifier les coefficients avant traitement.
-   Conserver les exports avec leur feuille d'audit.

------------------------------------------------------------------------

# 11. Questions fréquentes

### Pourquoi certaines lignes sont-elles absentes ?

Elles ont été rejetées lors de la validation.

### Puis-je modifier les coefficients ?

Oui, à condition que leur somme reste égale à 100 %.

### Les données quittent-elles mon ordinateur ?

Non. Tous les traitements sont réalisés localement.

------------------------------------------------------------------------

# 12. Assistance

En cas d'évolution de l'application ou d'adaptation à un nouveau
contexte métier, il est recommandé de conserver les principes de
transparence, de traçabilité et de reproductibilité qui fondent le
fonctionnement de Pondr.
