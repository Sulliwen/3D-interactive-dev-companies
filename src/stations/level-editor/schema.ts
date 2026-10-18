import { z } from 'zod'

/** Un point de la carte, en pourcentage de la vue de dessus (0 à 100). */
const point = z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)])

export const levelEditorPropsSchema = z.object({
  /** Scène ouverte (barre de titre). */
  scene: z.string(),
  /** Mode d'affichage du décor (« Blocs gris », « Décor final »). */
  viewMode: z.string(),
  /** Arborescence de la scène : objets du niveau, indentés. */
  hierarchy: z
    .array(
      z.object({
        name: z.string(),
        depth: z.number().int().min(0).max(3),
        selected: z.boolean().optional(),
      }),
    )
    .min(4)
    .max(14),
  /** Vue de dessus. */
  map: z.object({
    /** Bâtiments en blocs gris : x, y, largeur, hauteur (en %). */
    blocks: z.array(z.tuple([z.number(), z.number(), z.number(), z.number()])).max(16),
    /** Chemin critique, du départ à l'arrivée. */
    path: z.array(point).min(2),
    /** Moments du niveau le long du chemin. */
    beats: z
      .array(z.object({ at: point, label: z.string() }))
      .min(2)
      .max(6),
    /** Lampes où recharger la lanterne. */
    lamps: z.array(z.object({ at: point, label: z.string() })).max(5),
    /** Zone délicate (la falaise) : rectangle x, y, largeur, hauteur (en %). */
    danger: z.object({
      rect: z.tuple([z.number(), z.number(), z.number(), z.number()]),
      label: z.string(),
    }),
    /** Repère visible de loin (le phare). */
    landmark: z.object({ at: point, label: z.string() }),
  }),
  /** Objet sélectionné dans l'inspecteur. */
  inspector: z.object({
    name: z.string(),
    fields: z
      .array(z.object({ label: z.string(), value: z.string() }))
      .min(2)
      .max(6),
  }),
  /** Mesures du niveau (temps de jeu, longueur du chemin…). */
  stats: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .min(2)
    .max(4),
})

export type LevelEditorProps = z.infer<typeof levelEditorPropsSchema>

export const LEVEL_EDITOR_ZONES = ['map', 'path', 'hierarchy', 'inspector', 'stats'] as const
