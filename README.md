# Dev Factory

Visite 3D éducative pour comprendre comment travaillent les équipes de développement
logiciel. Le visiteur choisit d'abord une **structure** (start-up, studio de jeu vidéo,
laboratoire de recherche…), puis un **type de développement** (une fonctionnalité réclamée
par les utilisateurs, la préparation d'une v2…). Il se promène ensuite librement dans les
locaux et suit ce travail d'un poste à l'autre ; l'étage, le parcours, les personnages et
les écrans s'adaptent au scénario choisi.

Structure disponible : _Atelier Lumen_, une start-up SaaS (application _Pocket Santé_),
avec quatre scénarios (les débuts de l'entreprise, une fonctionnalité réclamée par les
utilisateurs, la v2 de l'application, le lancement d'un nouveau produit). Les autres structures sont annoncées « en préparation ».

> **État : phase 5 (finitions) — visite complète.** Étage modélisé dans Blender (assets CC0,
> éclairage précalculé), 14 métiers habités, parcours guidé, ambiance sonore, menu de
> lancement, présentation filmée de chaque scénario, tutoriel et écran de fin. Sans les modèles (`public/models/`), le jeu affiche l'étage en
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
| Présentation du scénario    | Espace : pause ; ← → : étape précédente / suivante ; Échap : passer     |
| _Dev_ : statistiques        | F2                                                                      |
| _Dev_ : collisions          | F3                                                                      |

Les touches sont lues par **position** sur le clavier : ZQSD et WASD fonctionnent sans réglage.

## Déploiement

Le build est 100 % statique (aucun serveur) et utilise des chemins relatifs : le contenu de
`dist/` peut être servi tel quel par GitHub Pages, Netlify ou un serveur web d'intranet.

**Netlify (configuré)** : `netlify.toml` décrit le build (`npm run build` → `dist/`) et le
cache des fichiers lourds. Publication manuelle depuis la machine :
`npx netlify-cli deploy --prod --dir=dist` (après `npx netlify-cli login`), ou automatique
en reliant le dépôt Git au site dans l'interface Netlify. Les modèles 3D et les sons sont
versionnés dans `public/` : le build n'a besoin ni de Blender ni des assets sources.

`.github/workflows/ci.yml` vérifie lint, tests et build à chaque push.

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
├─ content/       textes validés par Zod : structures/<structure>/ (métiers, scénarios,
│                 étapes), glossary/, screens/ (extraits de code affichés)
├─ assets/        images fixes des écrans (générées)
└─ state/         état global (Zustand), progression, stockage local
```

Le plan de l'étage (`src/engine/world/floorplan.ts`) est la source unique du blockout,
des collisions et de l'emplacement des postes. Il sera remplacé en phase 3 par le modèle
exporté de Blender, qui reprendra les mêmes repères (`spawn_*`, `anchor_station_NN`, `col_*`).

Tout le contenu pédagogique est aussi accessible **sans la 3D** : menu « Tous les postes ».

Voir aussi [`docs/blender-pipeline.md`](docs/blender-pipeline.md), [`docs/ajouter-une-station.md`](docs/ajouter-une-station.md) et [`CREDITS.md`](CREDITS.md).
