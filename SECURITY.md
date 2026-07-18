# SECURITY.md

> **Politique de sécurité -- Pondr**\
> Version 1.3.0 --- © 2026 Karim Khenifer

# Objectif

Pondr a été conçu selon un principe fondamental : **les données des
utilisateurs ne doivent pas quitter leur poste de travail**.

L'application fonctionne intégralement dans le navigateur et ne
nécessite aucun serveur applicatif.

------------------------------------------------------------------------

# Principes de sécurité

## Traitement local

-   Aucun envoi de données vers Internet.
-   Aucune base de données distante.
-   Aucun service d'authentification.
-   Aucun traitement côté serveur.

## Confidentialité

Les fichiers importés restent dans la mémoire du navigateur pendant leur
traitement.

Les seules informations conservées entre deux sessions sont les
coefficients de pondération, enregistrés dans le stockage local du
navigateur.

Aucune donnée nominative n'est transmise à l'auteur.

------------------------------------------------------------------------

# Validation des données

Avant tout calcul, Pondr vérifie notamment :

-   la présence des colonnes obligatoires ;
-   les formats de dates ;
-   les valeurs numériques ;
-   le statut boursier ;
-   les valeurs négatives ;
-   les incohérences de saisie.

Les lignes invalides sont rejetées et signalées dans un rapport de
conformité.

------------------------------------------------------------------------

# Protection contre les injections

Toutes les données affichées dans l'interface sont échappées avant
insertion dans le DOM afin de limiter les risques d'injection HTML ou
JavaScript (XSS).

------------------------------------------------------------------------

# Intégrité des traitements

L'algorithme est déterministe :

-   mêmes données ;
-   mêmes coefficients ;
-   même résultat.

Aucun facteur aléatoire n'intervient dans le classement.

------------------------------------------------------------------------

# Dépendances

Le projet limite volontairement le nombre de dépendances.

La bibliothèque **SheetJS** est utilisée exclusivement pour la lecture
et l'écriture des fichiers Excel.

------------------------------------------------------------------------

# Recommandations

Pour une utilisation optimale :

-   utiliser un navigateur récent ;
-   conserver les exports d'audit ;
-   protéger les fichiers sources contenant des données personnelles ;
-   vérifier les coefficients avant chaque traitement.

------------------------------------------------------------------------

# Signalement d'une vulnérabilité

Si vous identifiez une vulnérabilité de sécurité, merci de la signaler
de manière responsable à l'auteur en décrivant :

-   le contexte ;
-   les étapes de reproduction ;
-   les impacts observés ;
-   une éventuelle proposition de correction.

Les signalements seront étudiés avant toute communication publique.

------------------------------------------------------------------------

# Limites

Pondr contribue à la confidentialité des données grâce à son
fonctionnement local. Toutefois, la sécurité globale dépend également :

-   du poste de travail utilisé ;
-   du navigateur ;
-   des mesures de protection mises en œuvre par l'établissement ;
-   de la gestion des fichiers exportés.
