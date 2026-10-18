import { z } from 'zod'

const zoneId = z.string().regex(/^[a-z0-9-]+$/)

export const pipelinePropsSchema = z.object({
  run: z.object({
    id: z.number().int().positive(),
    title: z.string(),
    trigger: z.string(),
    branch: z.string(),
    commit: z.string(),
  }),
  /** Étapes, dans l'ordre ; `zone` permet d'y poser une pastille. */
  stages: z
    .array(
      z.object({
        label: z.string(),
        detail: z.string(),
        duration: z.string(),
        zone: zoneId.optional(),
      }),
    )
    .min(2),
  rollout: z.object({
    /** Nom de l'interrupteur de fonctionnalité. */
    flag: z.string(),
    steps: z
      .array(
        z.object({ percent: z.number().min(0).max(100), label: z.string(), check: z.string() }),
      )
      .min(1),
    /** Message affiché après un retour arrière (mode interactif). */
    rollbackMessage: z.string(),
  }),
  log: z.array(z.string()).min(1),
})

export type PipelineProps = z.infer<typeof pipelinePropsSchema>

export const PIPELINE_FIXED_ZONES = [
  'pipeline-header',
  'rollout',
  'feature-flag',
  'job-log',
] as const
