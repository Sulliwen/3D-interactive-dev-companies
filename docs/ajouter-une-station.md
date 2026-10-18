# Ajouter une structure, un scénario ou un poste

Le contenu est rangé par **structure** (l'entreprise fictive et son étage), puis par
**scénario** (un type de développement suivi d'un poste à l'autre) :

```
src/content/structures/
├─ upcoming.json                     structures annoncées « en préparation » à l'accueil
└─ atelier-lumen/
   ├─ structure.json                 l'entreprise : nom, type, résumé, décor 3D (`world`)
   ├─ roles/NN-identifiant.json      un métier par poste de l'étage (NN = numéro du poste)
   └─ scenarios/
      ├─ retours-utilisateurs/
      │  ├─ scenario.json            titre, résumé, travail suivi, accueil, écran de fin
      │  └─ steps/NN-identifiant.json   une étape par métier qui intervient
      └─ preparer-v2/ …
```

Tout est découvert automatiquement : ajouter un fichier suffit. Le moteur 3D n'est jamais
modifié, sauf pour la mise en scène propre à un scénario (§ 6) et pour un nouvel étage.

Les métiers et les étapes du scénario `retours-utilisateurs` (poste 8, `08-backend.json`)
servent de modèle complet.

## 1. Le métier (ce qui ne change pas d'un scénario à l'autre)

```jsonc
// roles/08-backend.json
{
  "id": "backend", // minuscules et tirets ; ne plus le changer (progression)
  "desk": 8, // poste de l'étage occupé (ancre anchor_station_08 de la scène)
  "title": "Développeur·se back-end",
  "person": { "firstName": "Awa", "lastName": "Diallo", "role": "Développeuse back-end" },
  "tagline": "Phrase d'accroche par défaut…",
  "missions": ["3 à 5 missions concrètes, par défaut"],
  "myth": { "myth": "Idée reçue…", "reality": "Réalité…" },
  "realTools": ["VS Code", "Git"],
}
```

## 2. L'étape (ce que fait ce métier dans un scénario)

```jsonc
// scenarios/retours-utilisateurs/steps/08-backend.json
{
  "role": "backend",
  "order": 8, // place dans le parcours (1, 2, 3… sans trou), ou "offPath": true pour un bonus
  "featureStep": "On construit la logique côté serveur", // aussi la légende de la présentation : ≤ 70 caractères
  "tagline": "…", // facultatif : remplace l'accroche du métier pour ce scénario
  "missions": ["…"], // facultatif : idem
  "takeaways": ["exactement", "trois", "points"],
  "receivesFrom": { "roles": ["product-owner", "design"], "text": "Ce que je reçois…" },
  "handsOffTo": { "roles": ["frontend", "code-review"], "text": "Ce que je transmets…" },
  "screen": {
    "component": "code-editor", // composant d'écran (voir § 4)
    "toolName": "Atelier Code", // nom fictif de l'outil
    "props": {}, // données propres au composant
    "annotations": [
      // 3 à 6 pastilles, numérotées dans cet ordre
      { "id": "rule-24h", "zone": "rule-24h", "title": "Titre court", "text": "Explication…" },
    ],
  },
}
```

Les métiers cités en amont et en aval doivent intervenir dans le même scénario.

## 3. Le scénario

`scenario.json` donne le titre et le résumé (cartes de choix), le travail suivi
(`workItem`), le texte d'accueil (`intro`), l'écran de fin (`finale`) et, pour chaque métier
qui **n'intervient pas**, ce que la personne fait pendant ce temps (`bystanders`) :

```jsonc
"bystanders": [
  {
    "role": "support",
    "note": "Lucie continue de répondre aux patients de la v1…",
    "screenFrom": "retours-utilisateurs" // écran réutilisé : elle travaille sur autre chose
  }
]
```

Ces postes restent visitables, grisés sur la carte et hors du parcours. Les tests exigent
que chaque métier de la structure soit soit une étape, soit un `bystander`.

Pour un scénario situé **avant l'arrivée** de quelqu'un (les débuts de l'entreprise),
`"absent": true` vide le bureau : personnage masqué, écran éteint, fiche « Pas encore là ».
La `note` dit alors quand et pourquoi la personne arrivera.

Au lancement d'une visite, une présentation montre le résumé du scénario (`summary`), puis
survole les postes du parcours dans l'ordre, avec `featureStep` pour légende.

### Mise en forme des textes

| Écriture                    | Résultat                                                |
| --------------------------- | ------------------------------------------------------- |
| `[[api]]`                   | terme du glossaire, affiché « API », avec sa définition |
| `[[api\|l'API]]`            | même terme, avec un autre texte affiché                 |
| `**important**`             | **gras**                                                |
| `` `if (hoursLeft < 24)` `` | extrait de code                                         |

Chaque terme cité doit exister dans l'un des fichiers `src/content/glossary/*.json`
(vérifié par `npm test`). Un nouveau poste peut apporter son propre fichier de glossaire ;
un même identifiant ne doit être défini qu'une fois.
La liste « Mots de ce poste » de la fiche est construite automatiquement.

**Ton** : public non technique. Une analogie du monde du travail vaut mieux qu'une définition
exacte mais abstraite. Pas de jargon sans renvoi au glossaire.

## 4. Les pastilles (annotations)

Chaque pastille vise une **zone** de l'écran simulé (`"zone": "…"`). Les zones disponibles
dépendent du composant :

- **`code-editor`** : `explorer`, `tabs`, `terminal`, plus toutes les zones déclarées dans
  les extraits de code (voir ci-dessous).

### Extraits de code

Les fichiers de code affichés vivent dans
`src/content/screens/<structure>/<scénario>/<poste>/*.txt`. Le code est
**en anglais**, les commentaires **en français**. Une zone se délimite par deux commentaires,
retirés à l'affichage :

```ts
// @zone rule-24h
if (hoursLeft < MIN_NOTICE_HOURS) {
  throw new HttpError(409, 'Annulation impossible à moins de 24 h')
}
// @end
```

Gardez des lignes de moins de 90 caractères environ (largeur de l'écran).

## 5. Un nouveau type d'écran

Si aucun composant existant ne convient (outil de tickets, tableau de bord, maquettage…) :

1. créer un dossier `src/stations/<type>/` avec le composant, son schéma Zod et son CSS ;
2. dans le composant, entourer les parties commentables de `<Zone id="…">` ;
3. y ajouter `definition.ts`, qui exporte `screen = defineScreen({ component, props, zones })`.
   Le dossier est découvert automatiquement : aucun registre à modifier.

Briques communes dans `src/stations/common/` : `AppWindow` (cadre de fenêtre), `charts.tsx`
(courbes, barres, chiffres clés, pastilles d'état), `Kanban`, `PocketSantePhone` (l'écran
d'annulation de l'application), `Icon`.

L'écran mesure **960 × 557 px** (proportions du moniteur 3D). Les noms et logos des vrais
outils sont interdits à l'écran : nom fictif, identité visuelle propre.

## 6. Mise en scène du scénario

Quand on change de scénario, l'étage change aussi : `src/engine/world/worlds/<monde>/staging.ts`
décrit, pour chaque visite (`structure/scénario`), où se tiennent les figurants et quels panneaux
apparaissent (tableau d'atelier, plan de version…). Les titulaires des postes restent à
leur bureau.

## 7. Image vue de loin

Hors zoom, la 3D affiche une image fixe de chaque écran
(`src/assets/screens/<structure>/<scénario>/station-NN.jpg`). Après toute modification :

```bash
npm run screens:capture                               # tout
npm run screens:capture -- atelier-lumen/preparer-v2  # un seul scénario
```

(Chrome ou Chromium requis ; chemin personnalisé avec `CHROME_PATH=…`.)

## 8. Cohérence du récit

Tous les chiffres, noms et identifiants affichés suivent la bible du scénario :
[`fil-rouge.md`](fil-rouge.md) (fonctionnalité réclamée par les utilisateurs),
[`fil-rouge-v2.md`](fil-rouge-v2.md) (préparer la v2).

## 9. Place dans l'étage

Le poste doit exister dans la scène avec le même numéro (`desk`) :

- **plan** : une place d'îlot dans `src/engine/world/floorplan.ts`
  (les `null` des appels à `deskIsland`) ;
- **modèle Blender** : un objet vide `anchor_station_NN` et un écran `screen_station_NN`.

## 10. Vérifier

```bash
npm test
```

Les tests vérifient : schémas, numérotation du parcours, métiers cités, termes du
glossaire, données de l'écran, extraits de code, images fixes, et que chaque pastille vise
une zone réelle.
