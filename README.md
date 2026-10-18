# Atelier Lumen · Dev Factory

Visite 3D éducative d'un étage d'éditeur de logiciels, pour comprendre comment travaillent
les équipes de développement. Le visiteur se promène librement dans les bureaux d'_Atelier
Lumen_ et suit une fonctionnalité de l'application _Pocket Santé_, de l'idée jusqu'à la
mise en production.

> **État : phase 5 (finitions) — visite complète.** Étage modélisé dans Blender (assets CC0,
> éclairage précalculé), 14 métiers habités, parcours guidé, ambiance sonore, accueil,
> tutoriel et écran de fin. Sans les modèles (`public/models/`), le jeu affiche l'étage en
> boîtes : tout le contenu reste consultable (« Tous les postes »).

## Prérequis

- Node.js **20.19 ou plus récent** (22 LTS recommandé)
- npm 10+

## Installation et lancement

```bash
npm install
npm run dev        # http://localhost:5173
```

| Commande                  | Rôle                                                                     |
| ------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`             | Serveur de développement avec rechargement                               |
| `npm run build`           | Vérification des types puis build dans `dist/`                           |
| `npm run preview`         | Sert le build de production en local                                     |
| `npm test`                | Tests Vitest (progression, contenu, postes)                              |
| `npm run lint`            | ESLint                                                                   |
| `npm run format`          | Prettier                                                                 |
| `npm run typecheck`       | TypeScript seul                                                          |
| `npm run screens:capture` | Régénère les images fixes des écrans (Chrome requis)                     |
| `npm run art:build`       | Passe artistique complète : scène Blender, éclairage, export (voir docs) |
| `npm run art:export`      | Refait éclairage + export depuis `art/atelier-lumen.blend` retouché      |
| `npm run art:characters`  | Personnages et animations (packs Quaternius requis, voir docs)           |
| `npm run audio:build`     | Sons d'ambiance (4 fichiers Freesound CC0, voir docs)                    |

## Commandes de la visite

| Action                      | Clavier / souris                                                        |
| --------------------------- | ----------------------------------------------------------------------- |
| Se déplacer                 | ZQSD (AZERTY) ou WASD (QWERTY), flèches haut / bas                      |
| Tourner la caméra           | Glisser avec la souris (clic gauche ou droit), flèches gauche / droite  |
| Aller plus vite             | Maj                                                                     |
| Zoom caméra                 | Molette                                                                 |
| Aller à un endroit          | Clic au sol, ou clic sur un poste de la mini-carte (itinéraire calculé) |
| Suivre le parcours          | Ligne lumineuse au sol vers le prochain poste ; « Carnet de visite »    |
| Regarder l'écran d'un poste | E à moins de 2 m, ou clic sur l'écran                                   |
| Revenir à la visite         | Échap, bouton « Retour » ou clic droit                                  |
| Tout lire sans la 3D        | Menu « Tous les postes »                                                |
| _Dev_ : statistiques        | F2                                                                      |
| _Dev_ : collisions          | F3                                                                      |

Les touches sont lues par **position** sur le clavier : ZQSD et WASD fonctionnent sans réglage.

## Déploiement

Le build est 100 % statique (aucun serveur) et utilise des chemins relatifs : le contenu de
`dist/` peut être servi tel quel par GitHub Pages, Netlify ou un serveur web d'intranet.

**GitHub Pages (configuré)** : `.github/workflows/deploy.yml` vérifie (lint, tests),
construit et publie la visite à chaque push sur `main`. Les modèles 3D et les sons sont
versionnés dans `public/` : la CI n'a besoin ni de Blender ni des assets sources.

**Intranet** : `npm run build`, puis copier `dist/` sur le serveur web.

```bash
npm run build
npm run preview    # vérification locale du build
```

Poids téléchargé : environ 40 Mo (budget : 50 Mo), chargé progressivement (l'étage
d'abord, puis les personnages et les sons).

## Organisation du code

```
src/
├─ engine/        moteur 3D générique (aucun contenu métier)
│  ├─ world/      plan de l'étage, blockout, collisions, décor
│  ├─ player/     avatar, contrôleur de personnage, clavier
│  ├─ camera/     caméra 3e personne
│  └─ stations/   ancres des postes, détection de proximité
├─ stations/      écrans simulés (éditeur de code…), pastilles et bulles
├─ ui/            interface par-dessus la 3D
├─ content/       textes : stations/*.json, glossary.json, company.json (validés par Zod),
│                 screens/ (extraits de code affichés)
├─ assets/        images fixes des écrans (générées)
└─ state/         état global (Zustand), progression, stockage local
```

Le plan de l'étage (`src/engine/world/floorplan.ts`) est la source unique du blockout,
des collisions et de l'emplacement des postes. Il sera remplacé en phase 3 par le modèle
exporté de Blender, qui reprendra les mêmes repères (`spawn_*`, `anchor_station_NN`, `col_*`).

Tout le contenu pédagogique est aussi accessible **sans la 3D** : menu « Tous les postes ».

Voir aussi [`docs/blender-pipeline.md`](docs/blender-pipeline.md), [`docs/ajouter-une-station.md`](docs/ajouter-une-station.md) et [`CREDITS.md`](CREDITS.md).
