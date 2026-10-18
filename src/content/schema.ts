import { z } from 'zod'

/**
 * Texte enrichi : `[[id]]` ou `[[id|texte affiché]]` renvoie au glossaire,
 * `**gras**` met en valeur, `` `code` `` affiche un extrait de code.
 */
const richText = z.string().min(1)

const slug = z.string().regex(/^[a-z0-9-]+$/, 'minuscules, chiffres et tirets uniquement')

export const annotationSchema = z.object({
  id: slug,
  /** Zone de l'écran simulé sur laquelle la pastille est posée. */
  zone: z.string().min(1),
  title: z.string().min(1),
  text: richText,
})

export type Annotation = z.infer<typeof annotationSchema>

export const screenSchema = z.object({
  /** Composant d'écran simulé (voir `src/stations/registry.ts`). */
  component: z.string().min(1),
  /** Nom de l'outil fictif affiché dans la barre de titre. */
  toolName: z.string().min(1),
  /** Données propres au composant, validées par son propre schéma. */
  props: z.unknown(),
  annotations: z.array(annotationSchema).min(3).max(6),
})

export type Screen = z.infer<typeof screenSchema>

const personSchema = z.object({ firstName: z.string(), lastName: z.string(), role: z.string() })

// --- Structure : l'entreprise et son étage --------------------------------------------

export const structureSchema = z.object({
  /** Identifiant stable (dossier `structures/<id>/`, progression). */
  id: slug,
  /** Ordre d'affichage parmi les structures. */
  order: z.number().int(),
  /** Nom de l'entreprise fictive. */
  name: z.string().min(1),
  /** Type de structure (« Start-up / scale-up SaaS »…). */
  kind: z.string().min(1),
  tagline: z.string().min(1),
  /** Présentation courte, sur la carte de choix. */
  summary: z.string().min(1),
  /** Quelques repères (taille, méthode, produit). */
  facts: z.array(z.string()).min(1).max(4),
  /** Décor 3D utilisé (plan de l'étage, modèle Blender). */
  world: slug,
  projects: z.array(
    z.object({ id: z.string(), name: z.string(), description: z.string(), featured: z.boolean() }),
  ),
})

export type Structure = z.infer<typeof structureSchema>

/** Structures annoncées sur l'écran de choix, pas encore visitables. */
export const upcomingSchema = z.array(
  z.object({
    kind: z.string().min(1),
    summary: z.string().min(1),
    scenarios: z.array(z.string()).min(1),
  }),
)

export type UpcomingStructure = z.infer<typeof upcomingSchema>[number]

/** Un métier de la structure, attaché à un poste de l'étage (ancre `desk`). */
export const roleSchema = z.object({
  /** Identifiant stable, utilisé pour la progression (ne pas renommer). */
  id: slug,
  /** Poste de l'étage occupé (ancre `anchor_station_NN` de la scène). */
  desk: z.number().int().positive(),
  title: z.string().min(1),
  person: personSchema,
  /** Accroche et missions par défaut ; une étape de scénario peut les remplacer. */
  tagline: richText,
  missions: z.array(richText).min(3).max(5),
  myth: z.object({ myth: richText, reality: richText }),
  /** Vrais outils du marché, cités en texte seulement. */
  realTools: z.array(z.string()).min(1),
})

export type Role = z.infer<typeof roleSchema>

// --- Scénario : un type de développement suivi d'un poste à l'autre --------------------

const handOffSchema = z.object({
  /** Métiers (identifiants de rôle) en amont ou en aval. */
  roles: z.array(slug).min(1),
  text: richText,
})

export const stepSchema = z.object({
  role: slug,
  /** Place dans le parcours (1, 2, 3…) ; absente pour un poste bonus. */
  order: z.number().int().positive().optional(),
  /** Poste bonus, hors du parcours (ex. Engineering Manager). */
  offPath: z.boolean().default(false),
  /** Ce qui arrive au travail suivi à cette étape. */
  featureStep: z.string().min(1),
  tagline: richText.optional(),
  missions: z.array(richText).min(3).max(5).optional(),
  takeaways: z.array(richText).length(3),
  receivesFrom: handOffSchema,
  handsOffTo: handOffSchema,
  screen: screenSchema,
})

export type Step = z.infer<typeof stepSchema>

export const scenarioSchema = z.object({
  /** Identifiant stable (dossier `scenarios/<id>/`, progression). */
  id: slug,
  order: z.number().int(),
  /** Famille de travail (« Évolution du produit », « Version majeure »…). */
  kind: z.string().min(1),
  title: z.string().min(1),
  /** Présentation courte, sur la carte de choix. */
  summary: z.string().min(1),
  /** Le travail suivi d'un poste à l'autre. */
  workItem: z.object({
    /** Étiquette de la fiche (« La fonctionnalité « Annuler un rendez-vous », ici »). */
    label: z.string().min(1),
    /** Énoncé complet, cité à l'accueil et dans le catalogue. */
    title: z.string().min(1),
    project: z.string().min(1),
  }),
  /** Présentation à l'accueil et dans « Tous les postes ». */
  intro: z.string().min(1),
  finale: z.object({
    lead: z.string().min(1),
    outcomesTitle: z.string().min(1),
    outcomes: z.array(z.object({ label: z.string(), before: z.string(), after: z.string() })),
  }),
  /** Postes qui n'interviennent pas : ce que la personne fait pendant ce temps. */
  bystanders: z.array(
    z.object({
      role: slug,
      note: richText,
      /** Scénario dont l'écran est réutilisé (la personne travaille sur autre chose). */
      screenFrom: slug.optional(),
      /**
       * La personne n'est pas encore là (scénario situé avant son arrivée) : bureau vide,
       * écran éteint. `note` dit alors quand et pourquoi elle arrivera.
       */
      absent: z.boolean().default(false),
    }),
  ),
})

export type Scenario = z.infer<typeof scenarioSchema>

// --- Glossaire --------------------------------------------------------------------------

export const glossarySchema = z.array(
  z.object({
    id: slug,
    term: z.string().min(1),
    definition: z.string().min(1),
    analogy: z.string().min(1).optional(),
  }),
)

export type GlossaryEntry = z.infer<typeof glossarySchema>[number]

// --- Poste résolu : ce que l'interface affiche, pour une visite donnée -----------------

export type StationStatus = 'path' | 'bonus' | 'bystander'

export interface Station {
  /** Identifiant du rôle (progression). */
  id: string
  /** Poste de l'étage (ancre dans la scène). */
  desk: number
  title: string
  status: StationStatus
  /** Place dans le parcours (1…n), `null` hors parcours. */
  step: number | null
  /** Ce qui arrive au travail suivi ici (ou ce que fait la personne, hors scénario). */
  featureStep: string
  person: Role['person']
  tagline: string
  missions: string[]
  myth: Role['myth']
  realTools: string[]
  /** Absents pour un poste qui n'intervient pas dans le scénario. */
  takeaways?: string[]
  receivesFrom?: { stations: number[]; text: string }
  handsOffTo?: { stations: number[]; text: string }
  screen?: Screen
  /** Scénario d'où vient l'écran (images fixes `assets/screens/<structure>/<scénario>/`). */
  screenScenario?: string
  /** Hors scénario et pas encore arrivée : bureau vide, écran éteint. */
  absent?: boolean
}
