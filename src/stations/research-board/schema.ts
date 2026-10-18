import { z } from 'zod'

export const researchBoardPropsSchema = z.object({
  /** Nom de l'étude (titre de la fenêtre). */
  study: z.string(),
  /** Qui a été interrogé. */
  sources: z.object({
    patients: z.number().int(),
    secretaries: z.number().int(),
    /** Libellés des deux groupes interrogés (par défaut : patients, secrétaires médicales). */
    labels: z.tuple([z.string(), z.string()]).default(['patients', 'secrétaires médicales']),
  }),
  /** Carte d'affinités : citations d'entretiens regroupées par thème. */
  themes: z
    .array(
      z.object({
        title: z.string(),
        notes: z.array(z.object({ text: z.string(), who: z.string() })).min(1),
      }),
    )
    .min(1)
    .max(4),
  persona: z.object({
    name: z.string(),
    age: z.number().int(),
    role: z.string(),
    quote: z.string(),
    needs: z.array(z.string()),
    frustrations: z.array(z.string()),
  }),
  /** Parcours utilisateur : étapes, ressenti, point de friction éventuel. */
  journey: z
    .array(
      z.object({
        step: z.string(),
        feeling: z.enum(['good', 'neutral', 'bad']),
        pain: z.string().optional(),
      }),
    )
    .min(3)
    .max(6),
  /** Titre du parcours (par défaut : « Parcours de <persona> pour annuler un rendez-vous »). */
  journeyTitle: z.string().optional(),
  /** Durée d'un entretien, affichée avec les sources. */
  interviewLength: z.string().default('45 min'),
  /** Le problème qualifié, en une phrase. */
  problem: z.string(),
})

export type ResearchBoardProps = z.infer<typeof researchBoardPropsSchema>

export const RESEARCH_BOARD_ZONES = [
  'affinity',
  'persona',
  'journey',
  'problem',
  'sources',
] as const
