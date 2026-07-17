# ARCHITECTURE.md

> **Pondr -- Documentation de l'architecture logicielle**\
> Version 1.1.0 --- © 2026 Karim Khenifer

# 1. Vue d'ensemble

Pondr est une application **SPA (Single Page Application)** développée
en HTML, CSS et JavaScript natif. Elle fonctionne exclusivement côté
client : aucune donnée métier n'est envoyée vers un serveur.

``` text
           Utilisateur
                │
                ▼
         index.html (UI)
                │
                ▼
             app.js
                │
 ┌──────────────┼──────────────┐
 ▼              ▼              ▼
parser.js  validation.js  scoring.js
      │            │             │
      └────────────┼─────────────┘
                   ▼
              table.js
                   │
                   ▼
              export.js
                   │
                   ▼
         Excel (.xlsx) / CSV
```

# 2. Organisation des modules

## app.js

Point d'entrée de l'application.

Responsabilités :

-   initialisation ;
-   gestion des événements ;
-   pilotage du traitement ;
-   orchestration des modules ;
-   suivi de la progression.

------------------------------------------------------------------------

## parser.js

Responsable de :

-   lecture des fichiers Excel ;
-   lecture des fichiers CSV ;
-   conversion en objets JavaScript homogènes.

------------------------------------------------------------------------

## validation.js

Garantit la qualité des données.

Contrôles réalisés :

-   colonnes obligatoires ;
-   dates ;
-   statut boursier ;
-   valeurs numériques ;
-   cohérence métier.

Les lignes invalides sont exclues du classement.

------------------------------------------------------------------------

## scoring.js

Implémente le cœur métier.

Fonctions :

-   calcul des minimums et maximums ;
-   normalisation ;
-   calcul des scores ;
-   pondération ;
-   classement ;
-   résolution des ex æquo.

------------------------------------------------------------------------

## table.js

Gestion de l'affichage :

-   rendu HTML ;
-   recherche ;
-   filtres ;
-   tri ;
-   activation des exports.

------------------------------------------------------------------------

## export.js

Produit :

-   un export Excel enrichi d'une feuille d'audit ;
-   un export CSV avec métadonnées.

------------------------------------------------------------------------

## utils.js

Fonctions transverses :

-   protection XSS ;
-   normalisation des chaînes ;
-   calcul d'âge ;
-   formatage ;
-   génération d'horodatage.

# 3. Flux de traitement

``` text
Import
   │
Validation
   │
Normalisation
   │
Calcul des scores
   │
Classement
   │
Affichage
   │
Export
```

# 4. Gestion des données

Les données transitent selon quatre états :

1.  données brutes ;
2.  données validées ;
3.  données enrichies (scores) ;
4.  données exportées.

# 5. Dépendances

## Internes

-   app.js
-   parser.js
-   validation.js
-   scoring.js
-   table.js
-   export.js
-   utils.js

## Externe

**SheetJS**

Utilisée uniquement pour :

-   lire les fichiers Excel ;
-   produire les exports Excel.

# 6. Sécurité

L'architecture privilégie :

-   traitement local ;
-   absence de serveur ;
-   validation systématique ;
-   échappement HTML ;
-   séparation stricte entre logique métier et interface.

# 7. Performances

Le traitement des jeux de données est réalisé par tranches via
`requestAnimationFrame`, ce qui maintient une interface fluide pendant
les opérations longues.

# 8. Extensibilité

Pour ajouter un critère :

1.  le parser si nécessaire ;
2.  le valider ;
3.  le normaliser ;
4.  l'intégrer au calcul ;
5.  l'ajouter à l'interface ;
6.  l'inclure dans les exports.

# 9. Principes de conception

-   séparation des responsabilités ;
-   modularité ;
-   faible couplage ;
-   traitement déterministe ;
-   reproductibilité des résultats ;
-   simplicité de maintenance.

# 10. Conclusion

L'architecture de Pondr repose sur une organisation modulaire facilitant
l'évolution du logiciel tout en assurant la lisibilité du code, la
robustesse des traitements et la confidentialité des données.
