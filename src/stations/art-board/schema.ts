import { z } from 'zod'

/** Sujets que la planche sait peindre (dessins générés, aucun visuel tiers). */
export const paintingKind = z.enum(['lighthouse', 'cliff', 'village', 'maelle'])

/** Ambiance d'une peinture : brume froide, ou phare rallumé. */
export const paintingMood = z.enum(['cold', 'warm'])

const color = z.string().regex(/^#[0-9a-f]{6}$/i)

export const artBoardPropsSchema = z.object({
  /** Fichier ouvert (barre de titre). */
  file: z.string(),
  /** Calques du dessin principal, du haut vers le bas. */
  layers: z.array(z.string()).min(2).max(6),
  /** Le dessin principal, en grand. */
  canvas: z.object({
    kind: paintingKind,
    mood: paintingMood,
    /** Variante de silhouette (0, 1, 2) : sert aux pistes explorées. */
    variant: z.number().int().min(0).max(2).default(0),
    title: z.string(),
  }),
  /** Pistes explorées avant de choisir (miniatures). */
  variants: z
    .array(
      z.object({
        label: z.string(),
        kind: paintingKind,
        mood: paintingMood,
        variant: z.number().int().min(0).max(2).default(0),
        chosen: z.boolean().optional(),
        note: z.string(),
      }),
    )
    .min(2)
    .max(4),
  /** Script couleur : la couleur dominante de chaque moment du niveau, dans l'ordre. */
  colorScript: z
    .array(z.object({ label: z.string(), sky: color, light: color }))
    .min(3)
    .max(7),
  /** Notes laissées sur la planche, pour les autres métiers. */
  notes: z
    .array(z.object({ to: z.string(), text: z.string() }))
    .min(1)
    .max(3),
})

export type ArtBoardProps = z.infer<typeof artBoardPropsSchema>
export type PaintingKind = z.infer<typeof paintingKind>
export type PaintingMood = z.infer<typeof paintingMood>

export const ART_BOARD_ZONES = ['canvas', 'variants', 'color-script', 'notes', 'layers'] as const
