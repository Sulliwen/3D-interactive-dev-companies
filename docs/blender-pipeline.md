# Pipeline Blender → navigateur

Ce guide explique comment l'étage 3D d'une structure (un **monde** : Atelier Lumen…) passe
de Blender au navigateur, et
comment le retoucher **sans être expert de Blender**. L'essentiel est automatisé : une
commande reconstruit tout ; vous intervenez dans Blender seulement là où votre œil compte
(choix des objets, matériaux, lumières).

## 1. Vue d'ensemble

```
src/engine/world/worlds/<monde>/plan.ts   ← plan de l'étage (cotes, postes, collisions)
        │  npm run art:build -- --world <monde>      (par défaut : atelier-lumen)
        ▼
art/build/<monde>/floorplan.json          ← le même plan, lisible par Blender
        │  tools/blender/build_scene.py    (script de scène du monde)
        ▼
art/<monde>.blend                         ← la scène : architecture, mobilier, assets, lumières
        │  tools/blender/bake_and_export.py   (précalcul de l'éclairage + export glTF)
        ▼
art/build/<monde>/office.glb + lightmaps
        │  gltf-transform (meshopt, textures KTX2)
        ▼
public/models/<monde>/office.glb, lightmap_*.ktx2, office.json   ← chargés par le jeu
```

Chaque monde a son dossier de modèles, téléchargé **seulement quand on choisit sa
structure** dans le menu. Le jeu continue de lire les **collisions** et l'emplacement des
**postes** dans `plan.ts`. Le modèle Blender, généré à partir du même plan, s'y superpose exactement.
Tant que le modèle n'existe pas, le jeu affiche l'étage en boîtes (blockout).

## 2. Prérequis (une seule fois)

| Outil             | Où                                                                  | Rôle                                       |
| ----------------- | ------------------------------------------------------------------- | ------------------------------------------ |
| Blender 4.5 LTS   | `~/apps/blender/blender` (sinon variable `BLENDER=/chemin/blender`) | scène, précalcul, export                   |
| KTX-Software 4.4  | `~/apps/ktx` (sinon `KTX_HOME=…`)                                   | compression des textures (KTX2)            |
| Python 3 + Pillow | `python3 -m pip install pillow`                                     | téléchargement et préparation des textures |
| Node.js           | déjà requis par le projet                                           | orchestration, gltf-transform              |

## 3. Les commandes

| Commande                         | Ce qu'elle fait                                                                     | Durée     |
| -------------------------------- | ----------------------------------------------------------------------------------- | --------- |
| `npm run art:build -- --quick`   | tout, avec un éclairage précalculé basse définition (pour vérifier vite)            | ~1 min    |
| `npm run art:build`              | tout, éclairage en haute définition (2 × 2048 px, 128 échantillons)                 | 10–20 min |
| `npm run art:build -- --rebuild` | régénère aussi la scène Blender depuis le plan (**écrase vos retouches** du .blend) | idem      |
| `npm run art:export`             | garde votre `.blend` tel quel ; refait précalcul, export et optimisation            | 10–20 min |

Aperçus rapides sans tout exporter (4 caméras « preview_* », images dans `art/build/`) :

```bash
~/apps/blender/blender --background art/atelier-lumen.blend --python tools/blender/render_preview.py -- 24
```

## 4. Ouvrir la scène dans Blender

```bash
~/apps/blender/blender art/atelier-lumen.blend
```

(ou `~/apps/blender-mcp.sh art/atelier-lumen.blend`, qui lance aussi le serveur blender-mcp).

Repères utiles pour débuter :

- **Naviguer** : molette = zoom ; molette enfoncée = tourner ; Maj + molette enfoncée =
  se déplacer. Touche **pavé numérique 7** = vue de dessus, **0** = vue d'une caméra.
- **Voir le rendu réaliste** : en haut à droite de la vue 3D, cliquer la 4ᵉ sphère
  (« Rendered »), ou **Z → Rendered**. C'est lent : réduisez la fenêtre.
- **Panneau Outliner** (en haut à droite) : la scène est rangée en collections.

| Collection     | Contenu                                                | Exportée ?                                                   |
| -------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| `architecture` | sol, plafond, murs, menuiseries, moquettes             | oui, avec lightmap                                           |
| `mobilier`     | bureaux, chaises, écrans, cuisine, canapés…            | oui, avec lightmap                                           |
| `decor`        | affiches, logo, post-it, plantes, carnets              | oui (plantes sans lightmap)                                  |
| `verre`        | vitrages                                               | oui, sans lightmap                                           |
| `lumieres`     | réglettes LED, suspensions, lampes de précalcul        | réglettes et suspensions oui ; lampes : servent au précalcul |
| `reperes`      | `spawn_main`, `anchor_station_NN`, `screen_station_NN` | oui (points de repère)                                       |
| `collisions`   | `col_*` (boîtes fil de fer)                            | non : le jeu les tire du plan                                |
| `bibliotheque` | modèles Poly Haven d'origine (cachés)                  | non                                                          |
| `apercus`      | caméras d'aperçu                                       | non                                                          |

**Conventions de nommage** (le code s'en sert) : `screen_station_05` (l'écran du poste 5),
`anchor_station_05` (où se tenir pour le regarder), `spawn_main` (départ), `col_*`
(collisions). 1 unité Blender = 1 mètre.

## 5. Modifier l'étage

**Règle d'or** : tout ce qui bloque le passage (murs, îlots, meubles) se décide dans
`src/engine/world/floorplan.ts`, puis `npm run art:build -- --rebuild`. Sinon, on pourrait
marcher à travers un meuble déplacé seulement dans Blender.

Ce qui se retouche librement dans Blender (puis `npm run art:export`) :

- **objets de décor** qui ne gênent pas le passage (affiches, objets sur les bureaux) ;
- **matériaux** (couleurs, rugosité) ;
- **lumières** de la collection `lumieres` (puissance, couleur) et le **ciel** (onglet
  World, « Strength »).

Pour déplacer un objet : le sélectionner (clic), **G** pour déplacer, **R** pour tourner,
**S** pour l'échelle ; X, Y ou Z juste après pour contraindre l'axe. **Ctrl + S** pour
enregistrer.

## 6. Ajouter des assets

### Poly Haven (recommandé, licence CC0)

1. Trouver l'asset sur [polyhaven.com](https://polyhaven.com) et noter son identifiant
   (fin de l'adresse, ex. `potted_plant_02`).
2. L'ajouter dans `tools/blender/assets.json` (rubrique `models` ou `textures`).
3. `python3 tools/blender/fetch_assets.py` le télécharge dans `art/sources/` ; les crédits
   sont ajoutés automatiquement à `CREDITS.md` au prochain `art:build`.
4. Le placer : soit dans `build_scene.py` (fonction `assets()`, sur le modèle de
   `place("potted_plant_02", …)`), soit à la main dans Blender (**Fichier → Importer →
   glTF 2.0**, puis le déplacer dans la collection `decor`).

### Autres sources (Kenney, Quaternius, Sketchfab)

Uniquement en **CC0 ou CC-BY** (filtre de licence sur Sketchfab). Télécharger le format
glTF/GLB, ranger les fichiers dans `art/sources/manuel/`, importer dans Blender, et
**ajouter une ligne dans `CREDITS.md`** (auteur, lien, licence) — c'est obligatoire en CC-BY.

Vérifier l'échelle après import (la touche **N** affiche les dimensions) : une chaise fait
environ 0,9 m de haut. Les modèles très détaillés se simplifient avec le modificateur
**Decimate** (onglet clé à molette → Add Modifier → Decimate → Ratio 0,2).

## 7. Matériaux compatibles glTF

Seul le **Principled BSDF** passe dans le navigateur, avec des **textures image**
branchées directement sur Base Color, Roughness, Normal (via un nœud Normal Map),
Emission, Alpha. Les nœuds procéduraux (Noise, Voronoi, Mix…) **ne sont pas exportés**.

Pour teinter une texture, on ne passe pas par un nœud : `assets.json` décrit des variantes
(saturation, luminosité, teinte, contraste) que `fetch_assets.py` fabrique en images. Exemple :
la moquette des îlots est la texture `poly_wool_herringbone` teintée en vert-de-gris.

## 8. L'éclairage précalculé (lightmaps)

Calculer l'éclairage réaliste (rebonds de lumière, ombres douces) en temps réel est trop
lourd pour un PC de bureau. On le **précalcule une fois** avec Cycles, dans des images
(« lightmaps ») plaquées sur un second jeu de coordonnées (UV `lightmap`). Dans le jeu :
**couleur du matériau × lumière précalculée**.

Ce que fait `bake_and_export.py`, automatiquement :

1. fusionne les objets fixes en deux groupes, `lm_architecture` et `lm_mobilier` ;
2. crée le second jeu d'UV (Smart UV Project + rangement des îlots) ;
3. précalcule la lumière **diffuse directe + indirecte, sans la couleur** (Bake → Diffuse) ;
4. débruite le résultat (Open Image Denoise) ;
5. l'encode en image 8 bits (valeurs divisées par une échelle notée dans `office.json`).

Sources de lumière prises en compte : le **ciel** (photo HDR, soleil orienté vers les baies
est), les **lampes de surface** sous chaque réglette LED, les **suspensions**.

## 9. Export et budgets

L'optimisation (`gltf-transform optimize`) compresse la géométrie (**meshopt**) et les
textures (**KTX2/Basis**, 1024 px max ; lightmaps en UASTC 2048 px). Budgets visés :

|                          | Budget                                       | Vérification                                                    |
| ------------------------ | -------------------------------------------- | --------------------------------------------------------------- |
| Téléchargement par étage | < 50 Mo (relevé de 30 à 50 Mo le 17/10/2026) | taille de `public/models/<monde>` + personnages + `dist/assets` |
| Appels de dessin         | < 150                                        | touche **F2** en mode dev (r3f-perf)                            |
| Triangles visibles       | < 500 000                                    | idem                                                            |
| Images                   | 60 i/s en 1080p sur puce graphique intégrée  | F2                                                              |

## 10. Vérifier dans le jeu

`npm run dev`, puis : **F2** (statistiques), **F4** (basculer modèle Blender ↔ blockout,
pour comparer), **F3** (collisions en fil de fer : elles doivent épouser le mobilier).

## 11. Dépannage

| Symptôme                           | Cause probable                             | Remède                                        |
| ---------------------------------- | ------------------------------------------ | --------------------------------------------- |
| Le jeu affiche toujours les boîtes | `public/models/<monde>/office.json` absent | `npm run art:build -- --world <monde>`        |
| Taches ou bruit dans l'éclairage   | trop peu d'échantillons                    | `npm run art:export` (128 par défaut)         |
| Coutures sombres sur les arêtes    | marge d'UV trop faible                     | augmenter `margin` dans `lightmap_uv()`       |
| Scène trop sombre / trop claire    | puissance des lampes ou du ciel            | collection `lumieres`, World → Strength       |
| « Blender introuvable »            | Blender ailleurs                           | `BLENDER=/chemin/blender npm run art:build`   |
| « ktx: command not found »         | KTX-Software absent                        | l'installer dans `~/apps/ktx` ou `KTX_HOME=…` |

## 12. Les personnages

```
art/sources/manuel/quaternius/   ← 2 zips gratuits (CC0) à télécharger sur itch.io, décompressés :
                                    ubc/ (Universal Base Characters) et ual/ (Universal Animation Library)
tools/blender/characters.json    ← qui est qui : corps, carnation, coiffure, tenue, accessoires
        │  npm run art:characters
        ▼
public/models/characters/<id>.glb, animations.glb, public/textures/avatars/*.jpg
```

Ce que font les scripts :

- **`build_characters.py`** compose chaque personnage : corps de base, carnation (mélange des
  textures claire et foncée, teinte), coiffure et barbe teintées, **vêtements générés depuis
  le corps** (copie des zones du torse, des jambes, des pieds, lissée puis gonflée : ils
  suivent le squelette), lunettes, casque, badge. Puis tout est fusionné en **un seul
  maillage avec une seule texture** (atlas cuit par Cycles) : un appel de dessin par
  personnage, plus une version allégée (`_lod1`) pour la distance.
- **`build_animations.py`** garde une sélection de la bibliothèque (repos, marche, course,
  assis, discussion) et crée les **gestes de bureau** par cinématique inverse : on place des
  cibles pour les mains (clavier, oreille, menton, tasse, tableau) et Blender calcule les bras.

Pour modifier un personnage (tenue, couleur, accessoire) : éditer `characters.json`, puis
`npm run art:characters -- awa` (seulement Awa). Où est assis chacun, et ce qu'il fait :
`src/engine/world/worlds/<monde>/people.ts`.

Dans le jeu : les personnages hors du champ de vision ne sont ni dessinés ni animés ; au-delà
de 9 m ils passent en version allégée, au-delà de 12 m leur animation ralentit (10 i/s) ;
20 au plus sont animés en même temps.

## 13. Les sons

Quatre enregistrements CC0 de Freesound (liens dans `CREDITS.md`) : fond d'open space,
murmures, clavier, machine à café. Après les avoir téléchargés (compte Freesound gratuit)
dans le dossier Téléchargements, `npm run audio:build` les copie dans
`art/sources/manuel/audio/`, puis Blender (sans ffmpeg) les découpe, ajoute des fondus, les
passe en mono et en MP3 96 kbit/s dans `public/audio/`. Découpes et gains : en tête de
`tools/blender/build_audio.py`.

Dans le jeu (`src/engine/audio/Ambience.tsx`) : fond et murmures partout, un clavier
spatialisé par personne qui tape, la machine à café toutes les 40 à 80 s. Le son démarre au
premier clic ou à la première touche (règle des navigateurs) ; volume et coupure dans les
Réglages.
