import { z } from 'zod'

const project = z.enum(['pocket-sante', 'facturo', 'mutuelle'])

export const roadmapPropsSchema = z.object({
  /** Titre de la vue (fenêtre). */
  view: z.string(),
  okr: z.object({
    objective: z.string(),
    keyResults: z.array(z.string()).min(1).max(3),
  }),
  /** Mois affichés sur la frise. */
  months: z.array(z.string()).min(3).max(8),
  /** Une ligne par projet ; chaque chantier couvre les mois [start, end] (index inclus). */
  lanes: z.array(
    z.object({
      project,
      name: z.string(),
      items: z.array(
        z.object({
          title: z.string(),
          start: z.number().int().nonnegative(),
          end: z.number().int().nonnegative(),
          highlight: z.boolean().optional(),
        }),
      ),
    }),
  ),
  /** Idées placées sur la matrice (0 = faible, 1 = fort). */
  matrix: z.array(
    z.object({
      label: z.string(),
      impact: z.number().min(0).max(1),
      effort: z.number().min(0).max(1),
      note: z.string(),
      highlight: z.boolean().optional(),
    }),
  ),
  /** « Pourquoi maintenant ? » */
  why: z.array(z.string()).min(1).max(4),
})

export type RoadmapProps = z.infer<typeof roadmapPropsSchema>

export const ROADMAP_ZONES = ['okr', 'timeline', 'matrix', 'why'] as const
