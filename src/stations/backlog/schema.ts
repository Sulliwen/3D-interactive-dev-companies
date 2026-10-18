import { z } from 'zod'

const gherkin = z.object({ given: z.string(), when: z.string(), then: z.string() })

export const backlogItemSchema = z.object({
  /** Identifiant du ticket (ex. PS-142). */
  id: z.string(),
  title: z.string(),
  project: z.enum(['pocket-sante', 'facturo', 'mutuelle']),
  /** Estimation en points ; `null` : pas encore estimée. */
  estimate: z.number().nullable(),
  /** Prête pour un sprint, à affiner, ou simple idée. */
  status: z.enum(['ready', 'refine', 'idea']),
  story: z.object({ asA: z.string(), iWant: z.string(), soThat: z.string() }).optional(),
  description: z.string().optional(),
  /** D'où vient la demande (chiffres, tickets…). */
  origin: z.string().optional(),
  /** Critères d'acceptation : phrase simple ou « Étant donné / Quand / Alors ». */
  criteria: z.array(z.union([z.string(), gherkin])).optional(),
  estimateNote: z.string().optional(),
  links: z
    .array(z.object({ label: z.string(), kind: z.enum(['design', 'sprint', 'support']) }))
    .optional(),
})

export const backlogPropsSchema = z.object({
  /** Nom du tableau (barre de titre). */
  board: z.string(),
  /** Vues listées dans la navigation (décor), la première est active. */
  views: z.array(z.string()).min(1),
  /** Éléments du backlog, du plus prioritaire au moins prioritaire. */
  items: z.array(backlogItemSchema).min(1),
  /** Élément ouvert au départ (la fonctionnalité suivie). */
  selected: z.string(),
})

export type BacklogProps = z.infer<typeof backlogPropsSchema>
export type BacklogItem = z.infer<typeof backlogItemSchema>

/** Zones du panneau de détail : présentes quand l'élément sélectionné au départ est ouvert. */
export const BACKLOG_DETAIL_ZONES = ['story', 'criteria', 'estimate', 'links'] as const
export const BACKLOG_ZONES = ['filters', 'backlog', 'detail', ...BACKLOG_DETAIL_ZONES] as const
