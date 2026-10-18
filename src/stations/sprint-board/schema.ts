import { z } from 'zod'

const card = z.object({
  id: z.string(),
  title: z.string(),
  project: z.enum(['pocket-sante', 'facturo', 'mutuelle', 'tournee']),
  estimate: z.number().optional(),
  assignee: z.string().optional(),
  tag: z.string().optional(),
  highlight: z.boolean().optional(),
  /** Zone de pastille posée sur cette carte. */
  zone: z.string().optional(),
})

export const sprintBoardPropsSchema = z.object({
  sprint: z.object({
    name: z.string(),
    dates: z.string(),
    /** Ex. « Jour 9 sur 10 ». */
    day: z.string(),
    goal: z.string(),
  }),
  /** Colonnes du tableau, dans l'ordre (mêmes intitulés que le mur Scrum de l'étage). */
  columns: z.array(z.object({ id: z.string(), title: z.string(), cards: z.array(card) })).min(2),
  burndown: z.object({
    /** Libellés des jours (le premier = début du sprint). */
    labels: z.array(z.string()).min(2),
    /** Points restants mesurés, jusqu'au dernier jour écoulé. */
    actual: z.array(z.number()),
    total: z.number().positive(),
    /** Index du jour en cours (repère « aujourd'hui »). */
    todayIndex: z.number().int().nonnegative(),
  }),
  daily: z.object({
    when: z.string(),
    entries: z.array(
      z.object({
        person: z.string(),
        yesterday: z.string(),
        today: z.string(),
        blocker: z.string().optional(),
      }),
    ),
  }),
  retro: z.object({
    sprint: z.string(),
    good: z.array(z.string()),
    improve: z.array(z.string()),
    actions: z.array(z.string()),
  }),
})

export type SprintBoardProps = z.infer<typeof sprintBoardPropsSchema>

export const SPRINT_BOARD_FIXED_ZONES = ['goal', 'board', 'burndown', 'daily', 'retro'] as const
