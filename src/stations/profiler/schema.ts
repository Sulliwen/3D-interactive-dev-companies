import { z } from 'zod'

const status = z.enum(['good', 'warning', 'serious', 'critical'])

/** Une capture : la durée de chaque image sur quelques secondes de jeu. */
const capture = z.object({
  label: z.string(),
  /** Durée moyenne d'une image (ms) et variation ordinaire autour d'elle. */
  average: z.number().positive(),
  jitter: z.number().nonnegative(),
  /** Nombre d'images capturées. */
  count: z.number().int().min(20).max(240).default(120),
  /**
   * Pics : de l'image `at` à l'image `to` (incluse, `at` seule par défaut), durée `ms`,
   * avec une légende facultative.
   */
  spikes: z
    .array(
      z.object({
        at: z.number().int().nonnegative(),
        to: z.number().int().nonnegative().optional(),
        ms: z.number().positive(),
        label: z.string().optional(),
      }),
    )
    .default([]),
})

export const profilerPropsSchema = z.object({
  /** Session ouverte (ex. « Profileur · Le Phare de Kerlaz »). */
  title: z.string(),
  /** Machine de référence et budget par image (16,6 ms = 60 images par seconde). */
  target: z.object({ name: z.string(), detail: z.string(), budgetMs: z.number().positive() }),
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
  before: capture,
  after: capture,
  /** Capture affichée à l'ouverture. */
  initial: z.enum(['before', 'after']).default('before'),
  /** Temps passé par système, pour l'image la plus lente : avant / après correction. */
  breakdown: z.object({
    title: z.string(),
    items: z
      .array(z.object({ system: z.string(), before: z.number(), after: z.number() }))
      .min(2)
      .max(7),
  }),
  fix: z.object({ title: z.string(), detail: z.string(), who: z.string() }),
  statusItems: z.array(z.string()).default([]),
})

export type ProfilerProps = z.infer<typeof profilerPropsSchema>
export type ProfilerCapture = z.infer<typeof capture>

export const PROFILER_ZONES = ['tiles', 'frames', 'breakdown', 'fix'] as const

/** Durées des images d'une capture (déterministe : même dessin à chaque affichage). */
export function captureFrames(c: ProfilerCapture): number[] {
  let h = 7
  for (const ch of c.label) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const rand = () => {
    h = (h * 1664525 + 1013904223) >>> 0
    return h / 2 ** 32
  }
  const frames = Array.from({ length: c.count }, () => c.average + (rand() - 0.5) * 2 * c.jitter)
  for (const s of c.spikes) {
    for (let i = s.at; i <= (s.to ?? s.at) && i < frames.length; i++) {
      // Un pic qui dure garde un peu de variation ; la première image vaut `ms` exactement.
      frames[i] = i === s.at ? s.ms : s.ms - rand() * c.jitter
    }
  }
  return frames
}
