# Tour de cartes — mélanges riffle et séquences

Démonstration interactive d’un tour mathématique : après deux mélanges et des coupes facultatives, une carte est déplacée et le programme cherche les cartes compatibles avec cette manipulation.

## Lancer la démonstration

Depuis le portfolio, cliquer sur **Essayer le tour de cartes**. La démonstration s’ouvre dans une fenêtre intégrée.

Elle est également accessible à l’adresse `tour-cartes/index.html` sur le site publié.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | Étapes, contrôles et zones d’affichage |
| `style.css` | Cartes, animations, résultats et mise en page adaptative |
| `script.js` | État de la partie, mélanges, coupes et analyse du paquet |

Aucune dépendance externe n’est nécessaire.

## Paquet initial

Le paquet contient 32 cartes personnalisées : les valeurs **8, 7, 6, 5, 4, 3, 2, as**, dans l’ordre des couleurs **trèfle, cœur, pique, carreau**.

Chaque carte est représentée par son rang initial, de 0 à 31. Cet ordre de référence sert à l’analyse des séquences. Il ne s’agit pas de la composition habituelle d’un jeu de 32 cartes.

## Déroulement

1. Afficher le paquet préparé.
2. Effectuer un premier riffle animé.
3. Effectuer un deuxième riffle animé.
4. Couper le paquet avec le curseur ou continuer sans coupe.
5. Prendre et mémoriser la carte du dessus.
6. Réinsérer la carte à l’un des emplacements proposés.
7. Effectuer une dernière coupe facultative.
8. Lancer la recherche, colorer les séquences ou vérifier la carte mémorisée.

La lecture du paquet va de gauche à droite, puis à la ligne suivante. Les résultats apparaissent au-dessus et en dessous du paquet.

## Mélange riffle

Chaque mélange sépare le paquet en deux moitiés, avec une première moitié de 12 à 20 cartes choisie aléatoirement.

Les deux moitiés sont ensuite entrelacées. À chaque étape, la probabilité de prendre une carte dans une moitié est proportionnelle à son nombre de cartes restantes. Plusieurs cartes peuvent donc provenir successivement de la même moitié.

L’ordre interne de chaque moitié est conservé. L’animation est interrompue si une nouvelle partie est lancée.

## Principe des séquences

Une séquence est un ensemble de rangs consécutifs dont les positions dans le paquet suivent l’ordre initial. Ses cartes ne sont pas nécessairement adjacentes.

Par exemple, le paquet `0152637894` conserve les séquences `01234` et `56789`.

Un riffle produit au maximum deux séquences, et deux riffles au maximum quatre, avant les coupes. Une coupe fait tourner le paquet : le compteur linéaire affiché par la coloration peut alors scinder une séquence circulaire.

## Recherche automatique

La fonction `findCandidates(finalDeck)` reçoit uniquement l’ordre final des cartes. Elle n’utilise ni la carte mémorisée ni l’historique des manipulations.

Pour chaque carte, elle :

1. retire provisoirement la carte du paquet final ;
2. teste ses positions de réinsertion pour annuler un déplacement possible ;
3. teste les rotations du paquet reconstitué ;
4. conserve la carte si l’une des configurations comporte au maximum quatre séquences linéaires.

Les positions de réinsertion sont considérées sur un cercle ; les frontières de début et de fin sont donc équivalentes.

Le critère est conservateur : il ne vérifie pas que les deux riffles reconstitués respecteraient chacun la contrainte de coupe entre 12 et 20 cartes.

- **Un candidat** : la carte est identifiée dans le cadre des manipulations prévues.
- **Plusieurs candidats** : l’application affiche l’ambiguïté sans choisir arbitrairement.
- **Aucun candidat** : le paquet ne correspond pas aux règles analysées.

La fonction ne modifie pas le paquet reçu.

## Recherche et vérification

Le bouton **Vérifier ma carte** utilise la carte mémorisée pour montrer sa position réelle. Cette vérification est distincte de la recherche automatique et ne participe pas à son calcul.

## Interface et accessibilité

Les boutons et le curseur sont les contrôles interactifs. Le texte et les cartes ne sont pas sélectionnables par défaut. Cette règle CSS n’empêche pas la copie du contenu par d’autres moyens.

Le même résultat est affiché dans deux zones. Une seule est annoncée par les technologies d’assistance pour éviter une lecture en double. Les animations CSS tiennent compte de la préférence de réduction des mouvements ; le rythme des étapes JavaScript conserve sa temporisation.

## Vérifications et limites

La syntaxe JavaScript et certaines interactions ont été vérifiées par simulation. Des comparaisons ont également contrôlé que le nettoyage du code conservait les candidats trouvés sur des paquets de test.

Ces vérifications ne constituent pas une preuve exhaustive de l’algorithme et ne remplacent pas les essais dans un navigateur, notamment sur téléphone.

## Réalisation

L’algorithme et ses limites sont explicités pour permettre leur étude et leur amélioration.