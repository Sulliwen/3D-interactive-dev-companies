import { z } from 'zod'

export const steamBackofficePropsSchema = z.object({
  /** Page ouverte (barre de titre). */
  page: z.string(),
  /** Compte à rebours jusqu'à la sortie. */
  countdown: z.object({ label: z.string(), at: z.string(), remaining: z.string() }),
  /** Listes de souhaits : ajouts par mois, objectif, pics expliqués. */
  wishlists: z.object({
    months: z.array(z.string()).min(4).max(18),
    /** Ajouts de chaque mois (le cumul est calculé). */
    added: z.array(z.number().nonnegative()).min(4).max(18),
    goal: z.number().positive(),
    goalLabel: z.string(),
    peaks: z.array(z.object({ index: z.number().int().nonnegative(), label: z.string() })).max(5),
  }),
  /** État de la page de la boutique : vérifications avant la sortie. */
  status: z.object({
    label: z.string(),
    checks: z
      .array(z.object({ label: z.string(), done: z.boolean() }))
      .min(2)
      .max(6),
  }),
  price: z.object({
    base: z.string(),
    /** Remise de lancement, en %. */
    discount: z.number().int().min(0).max(90),
    launch: z.string(),
    until: z.string(),
  }),
  press: z.object({
    embargo: z.string(),
    lifted: z.boolean(),
    keys: z
      .array(z.object({ label: z.string(), count: z.number().int().nonnegative() }))
      .min(1)
      .max(3),
    note: z.string(),
  }),
  footer: z.string(),
})

export type SteamBackofficeProps = z.infer<typeof steamBackofficePropsSchema>

export const STEAM_BACKOFFICE_ZONES = [
  'wishlists',
  'countdown',
  'status',
  'price',
  'press',
] as const
