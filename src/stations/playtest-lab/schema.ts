import { z } from 'zod'

/** Un point de la carte du niveau, en coordonnées 0–100 (x) et 0–62 (y). */
const point = z.tuple([z.number().min(0).max(100), z.number().min(0).max(62)])

const session = z.object({
  /** Onglet (« Playtest n° 1 »). */
  label: z.string(),
  /** Date et nombre de joueurs (« vendredi 6 nov. · 8 joueurs »). */
  detail: z.string(),
  /** Taches de la carte de chaleur : où les joueurs passent du temps (v de 0 à 1). */
  heat: z.array(z.object({ at: point, r: z.number().positive(), v: z.number().min(0).max(1) })),
  /** Événements notables : joueur perdu, mort, arrêt (avec un nombre de joueurs). */
  markers: z.array(
    z.object({ at: point, kind: z.enum(['lost', 'death', 'stop']), count: z.number().int() }),
  ),
  /** Chiffres clés (3 au plus). */
  stats: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        detail: z.string().optional(),
        status: z.enum(['good', 'warning', 'serious', 'critical']).optional(),
      }),
    )
    .min(1)
    .max(3),
  /** Entonnoir : combien de joueurs atteignent chaque moment du niveau, sans aide. */
  funnel: z.array(z.object({ label: z.string(), count: z.number().int().nonnegative() })).min(2),
})

export const playtestLabPropsSchema = z.object({
  /** Étude (barre de titre). */
  study: z.string(),
  status: z.string(),
  /** Plan schématique du niveau : chemin principal et lieux nommés. */
  map: z.object({
    path: z.array(point).min(2),
    places: z.array(z.object({ label: z.string(), at: point })),
    /** Lieu mis en évidence (le problème). */
    focus: z.object({ label: z.string(), at: point, r: z.number().positive() }),
  }),
  /** 1 ou 2 sessions ; la première est affichée vue de loin. */
  sessions: z.array(session).min(1).max(2),
  /** Ce que disent les joueurs (prénom ou numéro, citation). */
  quotes: z
    .array(z.object({ who: z.string(), text: z.string() }))
    .min(1)
    .max(3),
  /** Le correctif décidé, et son effet mesuré. */
  fix: z.object({
    title: z.string(),
    text: z.string(),
    by: z.string(),
    measure: z.object({ label: z.string(), before: z.string(), after: z.string() }),
  }),
})

export type PlaytestLabProps = z.infer<typeof playtestLabPropsSchema>

export const PLAYTEST_LAB_ZONES = ['heatmap', 'stats', 'funnel', 'quotes', 'fix'] as const
