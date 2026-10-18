import { z } from 'zod'

/** Point d'une courbe : (valeur du paramètre, volume), tous deux entre 0 et 1. */
const point = z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)])

export const audioMixerPropsSchema = z.object({
  /** Évènement sonore ouvert (ex. « AMB_Kerlaz · ambiance interactive »). */
  title: z.string(),
  /** Évènements du projet (le jeu les déclenche par leur nom). */
  events: z
    .array(z.object({ name: z.string(), note: z.string(), active: z.boolean().optional() }))
    .min(2)
    .max(8),
  /** Paramètre envoyé par le jeu, qui pilote le mélange des couches. */
  parameter: z.object({
    name: z.string(),
    /** Valeur affichée au repos (0 à 1). */
    value: z.number().min(0).max(1),
    minLabel: z.string(),
    maxLabel: z.string(),
    /** D'où vient la valeur, côté jeu. */
    source: z.string(),
  }),
  /** Couches de l'évènement : volume selon le paramètre (courbe), fichier joué. */
  layers: z
    .array(
      z.object({
        name: z.string(),
        file: z.string(),
        curve: z.array(point).min(2),
      }),
    )
    .min(2)
    .max(4),
  /** Bus de mixage (groupes de sons), niveau en dB. */
  buses: z
    .array(z.object({ name: z.string(), db: z.number().max(6) }))
    .min(2)
    .max(5),
  music: z.object({ title: z.string(), composer: z.string(), note: z.string() }),
  statusItems: z.array(z.string()).default([]),
})

export type AudioMixerProps = z.infer<typeof audioMixerPropsSchema>

export const AUDIO_MIXER_ZONES = ['events', 'parameter', 'layers', 'mixer', 'music'] as const

/** Volume d'une couche pour une valeur du paramètre (interpolation linéaire de la courbe). */
export function volumeAt(curve: ReadonlyArray<readonly [number, number]>, x: number): number {
  const pts = [...curve].sort((a, b) => a[0] - b[0])
  if (x <= pts[0]![0]) return pts[0]![1]
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i]!
    const [x0, y0] = pts[i - 1]!
    if (x <= x1) return x1 === x0 ? y1 : y0 + ((x - x0) / (x1 - x0)) * (y1 - y0)
  }
  return pts[pts.length - 1]![1]
}

/** Volume (0 à 1) en décibels, pour l'affichage (« −∞ » pour le silence). */
export function toDb(volume: number): string {
  if (volume <= 0.001) return '−∞ dB'
  const db = 20 * Math.log10(volume)
  return `${db.toLocaleString('fr-FR', { maximumFractionDigits: 1, signDisplay: 'exceptZero' }).replace('-', '−')} dB`
}
