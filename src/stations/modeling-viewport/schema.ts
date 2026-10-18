import { z } from 'zod'

export const modelingViewportPropsSchema = z.object({
  /** Fichier ouvert (barre de titre). */
  file: z.string(),
  /** Objet affiché dans la vue (le modèle du phare). */
  object: z.string(),
  /** Nombre de triangles du modèle, et budget fixé avec le technical artist. */
  triangles: z.object({
    current: z.number().int().positive(),
    budget: z.number().int().positive(),
  }),
  /** Niveaux de détail : le même objet, de plus en plus simple avec la distance. */
  lods: z
    .array(
      z.object({ name: z.string(), triangles: z.number().int().positive(), distance: z.string() }),
    )
    .min(2)
    .max(4),
  /** Textures du modèle. */
  textures: z
    .array(z.object({ slot: z.string(), size: z.string(), color: z.string() }))
    .min(2)
    .max(4),
  /** Pièces du kit modulaire, réutilisées dans tout le village. */
  kit: z
    .array(z.object({ name: z.string(), uses: z.number().int().nonnegative() }))
    .min(2)
    .max(6),
  /** Note de la planche de référence, épinglée dans la vue. */
  reference: z.string(),
})

export type ModelingViewportProps = z.infer<typeof modelingViewportPropsSchema>

export const MODELING_VIEWPORT_ZONES = ['viewport', 'budget', 'lods', 'textures', 'kit'] as const
