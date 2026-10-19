import { z } from 'zod'

/** Sujets que la planche sait peindre (dessins générés, aucun visuel tiers). */
export const paintingKind = z.enum(['lighthouse', 'cliff', 'village', 'maelle', 'keyart'])

/** Ambiance d'une peinture : brume froide, ou phare rallumé. */
export const paintingMood = z.enum(['cold', 'warm'])

const color = z.string().regex(/^#[0-9a-f]{6}$/i)

/** Logo du jeu posé sur l'image (illustration de la boutique) : absent, normal ou agrandi. */
export const paintingLogo = z.enum(['none', 'normal', 'large'])

export const artBoardPropsSchema = z.object({
  /** Fichier ouvert (barre de titre). */
  file: z.string(),
  /** Outil actif (à droite de la barre de titre). */
  brush: z.string().default('Pinceau · Brume douce · 38 %'),
  /** Titres des panneaux (pistes, script couleur). */
  variantsTitle: z.string().default('Pistes explorées'),
  scriptTitle: z.string().default('Script couleur du niveau'),
  /** Calques du dessin principal, du haut vers le bas. */
  layers: z.array(z.string()).min(2).max(6),
  /** Le dessin principal, en grand. */
  canvas: z.object({
    kind: paintingKind,
    mood: paintingMood,
    /** Variante de silhouette (0, 1, 2) : sert aux pistes explorées. */
    variant: z.number().int().min(0).max(2).default(0),
    logo: paintingLogo.default('none'),
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
        logo: paintingLogo.default('none'),
        /** Format imposé (en pixels) : la miniature en prend les proportions. */
        format: z
          .object({ w: z.number().int().positive(), h: z.number().int().positive() })
          .optional(),
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
export type PaintingLogo = z.infer<typeof paintingLogo>

export const ART_BOARD_ZONES = ['canvas', 'variants', 'color-script', 'notes', 'layers'] as const
