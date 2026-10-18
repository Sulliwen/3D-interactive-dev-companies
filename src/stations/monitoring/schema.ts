import { z } from 'zod'

const status = z.enum(['good', 'warning', 'serious', 'critical'])

export const monitoringPropsSchema = z.object({
  /** Période affichée (ex. « 7 premiers jours après la mise en ligne »). */
  period: z.string(),
  tiles: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        detail: z.string(),
        status: status.optional(),
      }),
    )
    .min(1)
    .max(4),
  /** Créneaux libérés / repris par jour. */
  slots: z.object({
    title: z.string(),
    labels: z.array(z.string()).min(2),
    freed: z.object({ label: z.string(), values: z.array(z.number()) }),
    taken: z.object({ label: z.string(), values: z.array(z.number()) }),
  }),
  /** Taux de rendez-vous non honorés (%), avec le repère de mise en ligne. */
  noShow: z.object({
    title: z.string(),
    labels: z.array(z.string()).min(2),
    values: z.array(z.number()),
    launchIndex: z.number().int().nonnegative(),
    launchLabel: z.string(),
  }),
  services: z.array(z.object({ name: z.string(), status, detail: z.string() })),
  incident: z.object({ when: z.string(), title: z.string(), detail: z.string() }),
  loop: z.object({
    title: z.string(),
    count: z.string(),
    quote: z.string(),
    action: z.string(),
  }),
})

export type MonitoringProps = z.infer<typeof monitoringPropsSchema>

export const MONITORING_ZONES = [
  'tiles',
  'slots',
  'no-show',
  'services',
  'incident',
  'loop',
] as const
