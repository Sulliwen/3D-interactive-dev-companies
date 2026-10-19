import { z } from 'zod'

export const milestonePlanPropsSchema = z.object({
  /** Vue ouverte (titre de la fenêtre). */
  view: z.string(),
  milestone: z.object({
    name: z.string(),
    date: z.string(),
    /** Compte à rebours (« J-22 »). */
    countdown: z.string(),
    goal: z.string(),
  }),
  /** Les semaines (sprints) jusqu'au jalon, avec les dates clés. */
  weeks: z
    .array(
      z.object({
        label: z.string(),
        dates: z.string(),
        focus: z.string(),
        current: z.boolean().optional(),
        events: z
          .array(
            z.object({
              day: z.string(),
              label: z.string(),
              kind: z.enum(['freeze', 'playtest', 'recording', 'demo', 'launch', 'press', 'other']),
            }),
          )
          .max(3),
      }),
    )
    .min(2)
    .max(4),
  /** Ce qui doit être dans le jalon. */
  scope: z
    .array(
      z.object({
        title: z.string(),
        owner: z.string(),
        status: z.enum(['done', 'doing', 'todo']),
      }),
    )
    .min(3)
    .max(8),
  /** Ce qu'on coupe pour tenir la date, et où ça part. */
  cuts: z
    .array(z.object({ title: z.string(), reason: z.string(), to: z.string() }))
    .min(1)
    .max(4),
  /** Charge de l'équipe : règle du studio, et charge prévue / disponible par discipline. */
  capacity: z.object({
    rule: z.string(),
    rows: z
      .array(
        z.object({
          team: z.string(),
          planned: z.number().nonnegative(),
          available: z.number().positive(),
        }),
      )
      .min(2)
      .max(6),
    unit: z.string().default('jours'),
  }),
  status: z.string(),
  /** Titres des panneaux et du décompte (défauts : jalon de la vertical slice). */
  scopeTitle: z.string().default('Dans la vertical slice'),
  cutsTitle: z.string().default('Coupé pour tenir la date'),
  capacityTitle: z.string().default("Charge de l'équipe"),
  scopeCount: z.string().default('livrables prêts'),
})

export type MilestonePlanProps = z.infer<typeof milestonePlanPropsSchema>

export const MILESTONE_PLAN_ZONES = ['milestone', 'calendar', 'scope', 'cuts', 'capacity'] as const
