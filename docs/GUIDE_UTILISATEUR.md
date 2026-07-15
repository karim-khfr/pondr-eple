# GUIDE_UTILISATEUR.md

> **Pondr -- Guide utilisateur**\
> Version 1.0 --- © 2026 Karim Khenifer

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
  Bourse         45 %
  Âge            20 %
  Distance       20 %
  Temps          15 %

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
