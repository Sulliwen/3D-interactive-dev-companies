import { z } from 'zod'

const status = z.enum(['good', 'warning', 'serious', 'critical'])

export const crashReportsPropsSchema = z.object({
  /** Vue ouverte (ex. « Brume · plantages depuis la sortie »). */
  title: z.string(),
  /** Période et plateforme, à droite de la barre de titre. */
  scope: z.string(),
  tiles: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        detail: z.string(),
        status: status.optional(),
      }),
    )
    .min(2)
    .max(4),
  /** Plantages reçus par tranche de temps, avec la sortie et le correctif repérés. */
  timeline: z.object({
    title: z.string(),
    buckets: z
      .array(z.object({ label: z.string(), value: z.number().int().nonnegative() }))
      .min(4)
      .max(30),
    /** Tranches marquées (index) : alerte, publication du correctif… */
    markers: z
      .array(z.object({ at: z.number().int().nonnegative(), label: z.string() }))
      .max(3)
      .default([]),
  }),
  /** Plantages regroupés par signature (même endroit du code, même cause probable). */
  groups: z
    .array(
      z.object({
        id: z.string(),
        signature: z.string(),
        count: z.number().int().nonnegative(),
        share: z.string(),
        /** Sur quelles machines (carte graphique, système…). */
        where: z.string(),
        status: status.optional(),
      }),
    )
    .min(2)
    .max(5),
  /** Le groupe ouvert, avec sa pile d'appels et le contexte des machines. */
  open: z.object({
    group: z.string(),
    frames: z.array(z.string()).min(2).max(7),
    context: z
      .array(z.object({ label: z.string(), value: z.string() }))
      .min(1)
      .max(5),
  }),
  /** Ce qui a été fait, heure par heure, et l'effet mesuré. */
  fix: z.object({
    title: z.string(),
    steps: z
      .array(z.object({ time: z.string(), text: z.string() }))
      .min(2)
      .max(6),
    before: z.string(),
    after: z.string(),
  }),
  statusItems: z.array(z.string()).default([]),
})

export type CrashReportsProps = z.infer<typeof crashReportsPropsSchema>

export const CRASH_REPORTS_ZONES = ['tiles', 'timeline', 'groups', 'stack', 'fix'] as const
