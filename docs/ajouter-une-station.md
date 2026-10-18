# Ajouter ou rédiger une station

Une station, c'est **un fichier de contenu** (`src/content/stations/NN-identifiant.json`) et,
si son outil est nouveau, **un composant d'écran simulé**. Le moteur 3D n'est jamais modifié.

La station 8 (`08-backend.json`) sert de modèle complet.

## 1. La fiche de contenu

```jsonc
{
  "id": "backend", // minuscules et tirets ; ne plus le changer (progression)
  "number": 8, // place dans le fil rouge, unique
  "title": "Développeur·se back-end",
  "featureStep": "On construit la logique côté serveur",
  "details": {
    // facultatif tant que le poste n'est pas rédigé
    "person": { "firstName": "Awa", "lastName": "Diallo", "role": "Développeuse back-end" },
    "tagline": "Phrase d'accroche…",
    "missions": ["3 à 5 missions concrètes"],
    "takeaways": ["exactement", "trois", "points"],
    "myth": { "myth": "Idée reçue…", "reality": "Réalité…" },
    "receivesFrom": { "stations": [5, 6, 7], "text": "Ce que je reçois…" },
    "handsOffTo": { "stations": [9, 10], "text": "Ce que je transmets…" },
    "realTools": ["VS Code", "Git"],
    "screen": {
      "component": "code-editor", // composant d'écran (voir § 3)
      "toolName": "Atelier Code", // nom fictif de l'outil
      "props": {}, // données propres au composant
      "annotations": [
        // 3 à 6 pastilles, numérotées dans cet ordre
        { "id": "rule-24h", "zone": "rule-24h", "title": "Titre court", "text": "Explication…" },
      ],
    },
  },
}
```

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

## 2. Les pastilles (annotations)

Chaque pastille vise une **zone** de l'écran simulé (`"zone": "…"`). Les zones disponibles
dépendent du composant :

- **`code-editor`** : `explorer`, `tabs`, `terminal`, plus toutes les zones déclarées dans
  les extraits de code (voir ci-dessous).

### Extraits de code

Les fichiers de code affichés vivent dans `src/content/screens/<poste>/*.txt`. Le code est
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

## 3. Un nouveau type d'écran

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

## 4. Image vue de loin

Hors zoom, la 3D affiche une image fixe de l'écran. Après toute modification d'un écran :

```bash
npm run screens:capture
```

(Chrome ou Chromium requis ; chemin personnalisé avec `CHROME_PATH=…`.)

## 5. Cohérence du récit

Tous les chiffres, noms et identifiants affichés suivent [`fil-rouge.md`](fil-rouge.md).

## 6. Place dans l'étage

Le poste doit exister dans la scène avec le même numéro :

- **blockout (actuel)** : une place d'îlot dans `src/engine/world/floorplan.ts`
  (les `null` des appels à `deskIsland`) ;
- **modèle Blender (phase 3+)** : un objet vide `anchor_station_NN` et un écran `screen_station_NN`.

Un poste bonus, hors des étapes du fil rouge, porte `"offPath": true` (ex. le poste 15,
Engineering Manager) : il n'entre pas dans la progression « N sur 14 ».

## 7. Vérifier

```bash
npm test
```

Les tests vérifient : schéma de la fiche, termes du glossaire, postes cités, données de
l'écran, existence des extraits de code, et que chaque pastille vise une zone réelle.
