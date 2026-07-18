# DEVELOPPEMENT.md

> **Pondr -- Guide de développement**\
> Version 1.3.0 --- © 2026 Karim Khenifer

# 1. Objectif

Ce document est destiné aux développeurs souhaitant maintenir, adapter
ou faire évoluer Pondr.

------------------------------------------------------------------------

# 2. Technologies

-   HTML5
-   CSS3
-   JavaScript ES6+
-   SheetJS (lecture/écriture Excel)

Aucun framework n'est utilisé.

------------------------------------------------------------------------

# 3. Principes de conception

-   séparation des responsabilités ;
-   modularité ;
-   traitement déterministe ;
-   exécution côté client ;
-   absence de dépendances inutiles.

------------------------------------------------------------------------

# 4. Organisation des modules

  Module          Responsabilité
  --------------- ------------------------
  app.js          Orchestration générale
  parser.js       Lecture des fichiers
  validation.js   Validation métier
  scoring.js      Calcul des scores
  table.js        Affichage et filtres
  export.js       Exports
  utils.js        Fonctions utilitaires

------------------------------------------------------------------------

# 5. Cycle de traitement

``` text
Import
  ↓
Parsing
  ↓
Validation
  ↓
Normalisation
  ↓
Scoring
  ↓
Tri
  ↓
Affichage
  ↓
Export
```

------------------------------------------------------------------------

# 6. Ajouter un critère

1.  Ajouter le champ au fichier source.
2.  Étendre la validation.
3.  Définir une règle de normalisation.
4.  Ajouter un coefficient.
5.  Modifier le calcul du score.
6.  Afficher le résultat dans le tableau.
7.  L'intégrer aux exports.

------------------------------------------------------------------------

# 7. Bonnes pratiques

-   Conserver un code modulaire.
-   Documenter les fonctions publiques.
-   Préserver la compatibilité avec les exports existants.
-   Éviter les effets de bord entre modules.

------------------------------------------------------------------------

# 8. Tests recommandés

-   Import Excel.
-   Import CSV.
-   Données invalides.
-   Jeu vide.
-   Valeurs identiques.
-   Jeux volumineux.
-   Export Excel.
-   Export CSV.

------------------------------------------------------------------------

# 9. Évolutions possibles

-   Nouveaux critères.
-   Profils de pondération.
-   Internationalisation.
-   Nouveaux formats d'export.
-   Paramètres partageables.

------------------------------------------------------------------------

# 10. Contribution

Toute évolution doit préserver :

-   la reproductibilité ;
-   la transparence des calculs ;
-   la confidentialité des données ;
-   la simplicité d'utilisation.
