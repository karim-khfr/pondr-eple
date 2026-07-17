# Documentation de l'algorithme de Pondr

> Version 1.1.0 --- © 2026 Karim Khenifer

# 1. Objectif

L'algorithme de Pondr produit un classement **objectif, reproductible et
transparent** de candidatures à partir de plusieurs critères pondérés.

Le premier cas d'usage concerne l'attribution du régime
**interne-externé** des EPLE, mais l'algorithme est générique.

------------------------------------------------------------------------

# 2. Principes

L'algorithme suit cinq étapes :

1.  Import des données.
2.  Validation des données.
3.  Normalisation des critères.
4.  Calcul du score global.
5.  Classement et résolution des ex æquo.

Chaque exécution avec les mêmes données et les mêmes coefficients
produit exactement le même résultat.

------------------------------------------------------------------------

# 3. Validation

Chaque ligne est contrôlée avant tout calcul.

Les vérifications portent notamment sur :

-   présence des colonnes obligatoires ;
-   cohérence des dates ;
-   statut boursier ;
-   valeurs numériques ;
-   distances positives ;
-   temps de trajet positifs.

Toute ligne invalide est exclue du calcul et reportée dans le rapport
d'anomalies.

------------------------------------------------------------------------

# 4. Critères

## Bourse

Notation fixe :

  Situation        Score
  -------------- -------
  Non boursier         0
  Échelon 0           40
  Échelon 1           50
  Échelon 2           60
  Échelon 3           70
  Échelon 4           80
  Échelon 5           90
  Échelon 6          100

## Âge

Les candidats les plus jeunes sont prioritaires.

Le score est calculé par normalisation inversée.

## Distance

Les candidats les plus éloignés obtiennent le meilleur score.

## Temps de trajet

Le trajet le plus long reçoit le meilleur score.

## Revenu Fiscal de Référence (RFR)
Les candidats issus de foyers aux revenus les plus modestes sont prioritaires.
Le score est calculé par normalisation inversée.

------------------------------------------------------------------------

# 5. Normalisation

Les critères quantitatifs sont convertis sur une échelle commune de 0 à
100.

Formule :

``` text
Score = (Valeur - Minimum) / (Maximum - Minimum) × 100
```

Pour l'âge :

``` text
Score = (Maximum - Valeur) / (Maximum - Minimum) × 100
```

Cette inversion traduit la priorité donnée aux élèves les plus jeunes.

Pour le RFR (normalisation inversée) :

``` text
Score = (Maximum - Valeur) / (Maximum - Minimum) × 100
```

Cette inversion traduit la priorité donnée aux foyers à faibles revenus.

------------------------------------------------------------------------

# 6. Cas limites

Si toutes les valeurs d'un critère sont identiques :

``` text
Maximum - Minimum = 0
```

Pondr remplace automatiquement le dénominateur par 1 afin d'éviter toute
division par zéro.

Tous les candidats reçoivent alors un score identique pour ce critère.

------------------------------------------------------------------------

# 7. Score global

Le score final est une somme pondérée.

``` text
ScoreGlobal =
ScoreBourse × CoeffBourse
+
ScoreAge × CoeffAge
+
ScoreDistance × CoeffDistance
+
ScoreRFR × CoeffRFR
+
ScoreTemps × CoeffTemps
```

Les coefficients doivent toujours totaliser 100 %.

Configuration par défaut :

  Critère      Pondération
  ---------- -------------
  Bourse              45 %
  Âge                 20 %
  Distance            20 %
  Temps               15 %

------------------------------------------------------------------------

# 8. Résolution des ex æquo

Ordre de comparaison :

1.  Score global
2.  Score bourse
3.  Score âge
4.  Score RFR
5.  Score distance
6.  Score temps
7.  Nom (ordre alphabétique)

Cette cascade garantit un classement totalement déterministe.

------------------------------------------------------------------------

# 9. Complexité

Validation :

``` text
O(n)
```

Calcul :

``` text
O(n)
```

Tri :

``` text
O(n log n)
```

Complexité globale :

``` text
O(n log n)
```

------------------------------------------------------------------------

# 10. Garanties

-   Même entrée → même résultat.
-   Aucun tirage aléatoire.
-   Aucune intervention humaine pendant le calcul.
-   Traçabilité des exports.
-   Paramètres enregistrés localement.

------------------------------------------------------------------------

# 11. Robustesse

L'algorithme prend notamment en charge :

-   dates Excel et CSV ;
-   différentes écritures du statut boursier ;
-   accents ;
-   erreurs de format ;
-   données manquantes ;
-   jeux de données homogènes.

------------------------------------------------------------------------

# 12. Adaptabilité

L'algorithme peut être réutilisé pour :

-   commissions d'admission ;
-   appels à candidatures ;
-   recrutements ;
-   attribution de places ;
-   classements multicritères.

L'ajout d'un nouveau critère consiste à :

1.  le valider ;
2.  le normaliser ;
3.  lui attribuer un coefficient ;
4.  l'intégrer au calcul du score.

------------------------------------------------------------------------

# 13. Conclusion

Pondr met en œuvre un algorithme simple à auditer, mathématiquement
cohérent et entièrement reproductible. La séparation entre validation,
normalisation, calcul et classement facilite sa maintenance et son
adaptation à de nouveaux contextes décisionnels.
