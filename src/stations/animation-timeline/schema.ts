import { z } from 'zod'

/** Poses que la vue sait dessiner (silhouette de Maëlle et sa lanterne). */
export const poseKind = z.enum(['rest', 'anticipation', 'raise', 'overshoot', 'settle'])

export const animationTimelinePropsSchema = z.object({
  /** Fichier ouvert (barre de titre). */
  file: z.string(),
  /** L'animation : nom, durée en images, cadence. */
  clip: z.object({
    name: z.string(),
    frames: z.number().int().min(4).max(240),
    fps: z.number().int().positive(),
  }),
  /** Image où se trouve la tête de lecture. */
  playhead: z.number().int().nonnegative(),
  /** Poses clés, dans l'ordre, avec leur image. */
  keys: z
    .array(z.object({ frame: z.number().int().nonnegative(), label: z.string(), pose: poseKind }))
    .min(2)
    .max(6),
  /** Pistes de la feuille d'exposition : une articulation, ses images clés. */
  tracks: z
    .array(z.object({ name: z.string(), frames: z.array(z.number().int().nonnegative()) }))
    .min(2)
    .max(7),
  /** Courbe d'une articulation (image, valeur en degrés). */
  curve: z.object({
    label: z.string(),
    points: z
      .array(z.tuple([z.number(), z.number()]))
      .min(3)
      .max(10),
    note: z.string(),
  }),
  /** Raccord avec l'animation suivante. */
  transition: z.object({
    to: z.string(),
    blendFrames: z.number().int().nonnegative(),
    note: z.string(),
  }),
})

export type AnimationTimelineProps = z.infer<typeof animationTimelinePropsSchema>
export type PoseKind = z.infer<typeof poseKind>

export const ANIMATION_TIMELINE_ZONES = [
  'poses',
  'dopesheet',
  'curve',
  'transition',
  'clip',
] as const
