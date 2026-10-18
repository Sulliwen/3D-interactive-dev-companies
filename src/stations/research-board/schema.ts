import { z } from 'zod'

export const researchBoardPropsSchema = z.object({
  /** Nom de l'étude (titre de la fenêtre). */
  study: z.string(),
  /** Qui a été interrogé. */
  sources: z.object({ patients: z.number().int(), secretaries: z.number().int() }),
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
