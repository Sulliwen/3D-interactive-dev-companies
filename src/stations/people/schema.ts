import { z } from 'zod'

export const peoplePropsSchema = z.object({
  oneOnOne: z.object({
    with: z.string(),
    when: z.string(),
    agenda: z.array(z.string()).min(1),
    goals: z.array(z.object({ label: z.string(), progress: z.number().min(0).max(100) })),
    kudos: z.object({ from: z.string(), text: z.string() }),
  }),
  hiring: z.object({
    role: z.string(),
    stages: z.array(z.object({ label: z.string(), count: z.number() })).min(2),
    note: z.string(),
  }),
  workload: z.object({
    sprint: z.string(),
    members: z.array(
      z.object({
        name: z.string(),
        role: z.string(),
        committed: z.number(),
        capacity: z.number(),
        note: z.string().optional(),
      }),
    ),
  }),
  onboarding: z.object({
    title: z.string(),
    tasks: z.array(z.object({ label: z.string(), done: z.boolean() })),
  }),
})

export type PeopleProps = z.infer<typeof peoplePropsSchema>

export const PEOPLE_ZONES = ['one-on-one', 'goals', 'hiring', 'workload', 'onboarding'] as const
