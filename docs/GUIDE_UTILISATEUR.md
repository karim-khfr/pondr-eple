# GUIDE_UTILISATEUR.md

> **Pondr -- Guide utilisateur**\
> © 2026 Karim Khenifer

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

# 3. Configuration des coefficients et de la date de référence

## Coefficients de pondération
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

## Date de référence
La date de référence sert de point de repère temporel pour le calcul de l'âge. Si un élève est né le 15 octobre 2011, l'algorithme comparera sa date de naissance à cette date de référence pour déterminer son âge au moment de la rentrée. **Il convient de saisir le 1er jour de la rentrée scolaire**.
Note : La date que vous choisissez est automatiquement mémorisée par votre navigateur d'une session à l'autre. Si vous cliquez sur le bouton "Réinitialiser les coefficients", la date reviendra également à sa valeur initiale.

Lorsque tous les paramètres ont été renseignés, cliquez sur **Enregistrer les coefficients et la date de référence** pour les appliquer.

------------------------------------------------------------------------

# 4. Import d'un fichier

Deux méthodes sont disponibles :

-   glisser-déposer du fichier ;
-   bouton **Parcourir**.

Formats acceptés :

-   Excel (.xlsx)
-   CSV (.csv)

Après import, le nom du fichier apparaît sous la zone de dépôt.

## IMPORTANT : format du critère boursier
Pour être validée par l'application, la colonne associée au critère boursier doit contenir exclusivement l'une des valeurs suivantes (insensible à la casse et aux accents) :
- Non-boursiers : Non
- Boursiers Échelon 0 : Oui ou 0
- Boursiers Échelons 1 à 6 :
  - Chiffre brut : 1, 2, 3, 4, 5, 6
  - Format Échelon : Échelon 3 ou Echelon 3 ou échelon 3
  - Format Complet : Boursier échelon 3

Toute autre mention textuelle (ex: "Dossier en cours", "Ancien échelon") entraînera le rejet de la ligne de l'élève au moment de l'import.

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

## Conseil Pratique : exporter vos données en toute confiance
Vous pouvez manipuler, rechercher et trier le tableau des résultats affiché à l'écran pour mener vos analyses et vérifications. L'exportation reste protégée : lorsque vous cliquez sur Exporter vers Excel ou CSV, l'application réordonne automatiquement la liste selon le classement officiel (du rang 1 au dernier rang) avant de générer le fichier. Vous avez ainsi la garantie de fournir un document officiel irréprochable à votre direction ou aux équipes pédagogiques.

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
