# ADMINISTRATION.md

> **Pondr -- Guide d'administration**\
> Version 1.1.0 --- © 2026 Karim Khenifer

# 1. Objet

Ce document s'adresse aux administrateurs fonctionnels de Pondr (chefs
d'établissement, secrétaires généraux, administrateurs techniques).

------------------------------------------------------------------------

# 2. Déploiement

Pondr ne nécessite :

-   aucune installation ;
-   aucune base de données ;
-   aucun serveur ;
-   aucun compte utilisateur.

Le projet peut être distribué sous la forme d'un simple dossier
contenant les fichiers HTML, CSS et JavaScript.

------------------------------------------------------------------------

# 3. Paramétrage

Les coefficients de pondération sont enregistrés dans le stockage local
du navigateur.

Valeurs par défaut :

  Critère      Valeur
  ---------- --------
  Bourse         40 %
  Âge            20 %
  Distance       20 %
  RFR            10 %
  Temps          10 %

La somme doit être égale à 100 %.

------------------------------------------------------------------------

# 4. Gestion des données

Les données importées restent exclusivement sur le poste de travail.

Aucun échange réseau n'est réalisé pendant le traitement.

------------------------------------------------------------------------

# 5. Sauvegarde

Les résultats doivent être archivés via les exports Excel ou CSV.

L'export Excel comprend une feuille d'audit permettant de retrouver les
paramètres utilisés lors du classement.

------------------------------------------------------------------------

# 6. Mise à jour

Pour mettre à jour Pondr :

1.  remplacer les fichiers du projet ;
2.  conserver les éventuels documents personnalisés ;
3.  vérifier le bon fonctionnement avec un jeu d'essai.

------------------------------------------------------------------------

# 7. Adaptation à d'autres usages

Pondr peut être adapté à :

-   appels à candidatures ;
-   attribution de places ;
-   commissions de sélection ;
-   recrutements internes.

Une adaptation implique :

-   l'ajout éventuel de nouveaux critères ;
-   l'évolution des règles de validation ;
-   la mise à jour des exports.

------------------------------------------------------------------------

# 8. Sécurité

Bonnes pratiques :

-   conserver le projet sur un espace sécurisé ;
-   limiter l'accès aux données sources ;
-   supprimer les fichiers temporaires si nécessaire ;
-   utiliser un navigateur à jour.

------------------------------------------------------------------------

# 9. Maintenance

Contrôler régulièrement :

-   la cohérence des coefficients ;
-   le format des fichiers importés ;
-   la compatibilité du navigateur ;
-   la disponibilité de la bibliothèque SheetJS.

------------------------------------------------------------------------

# 10. Assistance

Toute évolution importante du modèle de classement doit être documentée
afin de garantir la traçabilité et la reproductibilité des décisions
administratives.
