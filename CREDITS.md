# Crédits

Liste tenue à jour de tous les assets tiers (modèles, textures, HDRI, animations, sons).
Seules les licences **CC0** et **CC-BY** sont acceptées ; pour CC-BY, l'attribution ci-dessous
est obligatoire.

| Asset                                                           | Auteur | Source | Licence | Utilisé dans |
| --------------------------------------------------------------- | ------ | ------ | ------- | ------------ |
| _(aucun asset tiers en phase 0 : tout est généré dans le code)_ |        |        |         |              |

### Personnages

| Asset                                          | Auteur     | Source                                             | Licence | Utilisé pour                                          |
| ---------------------------------------------- | ---------- | -------------------------------------------------- | ------- | ----------------------------------------------------- |
| Universal Base Characters (version Standard)   | Quaternius | [quaternius.com](https://quaternius.com) / itch.io | CC0     | corps, coiffures, yeux des personnages                |
| Universal Animation Library (version Standard) | Quaternius | [quaternius.com](https://quaternius.com) / itch.io | CC0     | animations (repos, marche, course, assis, discussion) |

Les vêtements, accessoires, badges et gestes de bureau (taper, téléphoner, réfléchir, boire,
montrer un post-it) sont générés par `tools/blender/build_characters.py` et
`tools/blender/build_animations.py` à partir de ces bases.

### Sons d'ambiance

| Son                                 | Auteur            | Source                                                                            | Licence | Utilisé pour             |
| ----------------------------------- | ----------------- | --------------------------------------------------------------------------------- | ------- | ------------------------ |
| Busy Office No People Loop          | Fupicat           | [Freesound 534123](https://freesound.org/people/Fupicat/sounds/534123/)           | CC0     | fond d'open space        |
| Office chatter and typing           | Alex_hears_things | [Freesound 636861](https://freesound.org/people/Alex_hears_things/sounds/636861/) | CC0     | murmures au loin         |
| Typing on Logitech K811 Keyboard HQ | SoundsLikeFoley   | [Freesound 396304](https://freesound.org/people/SoundsLikeFoley/sounds/396304/)   | CC0     | claviers près des postes |
| Nespresso Machine Making Coffee     | bassimat          | [Freesound 832445](https://freesound.org/people/bassimat/sounds/832445/)          | CC0     | machine à café           |

Les visuels de décor (affiches, écran d'accueil, plan d'évacuation, calendrier) et le mobilier
modélisé sur mesure (bureaux, chaises, écrans, cuisine…) sont générés par les scripts du projet.

## Outils

Blender (GPL, outil de production, non distribué), KTX-Software (Apache-2.0), glTF Transform
(MIT), Open Image Denoise (Apache-2.0). Polices des visuels générés : DejaVu (licence libre).

## Bibliothèques logicielles

Three.js, React Three Fiber, drei, @react-three/rapier (Rapier), Zustand, Zod (licences MIT /
Apache-2.0). La liste complète figure dans `package.json`.
