import { z } from 'zod'

export const designDocPropsSchema = z.object({
  /** Titre du document (fenêtre et page). */
  document: z.string(),
  /** Espace du carnet (le jeu), en tête du sommaire. */
  space: z.string().default('Brume'),
  author: z.string(),
  updated: z.string(),
  /** Sommaire du carnet (pages voisines) ; `active` : la page affichée. */
  outline: z
    .array(z.object({ title: z.string(), active: z.boolean().optional() }))
    .min(2)
    .max(8),
  /** Chapeau de la page. */
  lead: z.string().optional(),
  /** Piliers du jeu : les quelques principes qui guident toutes les décisions. */
  pillars: z
    .array(z.object({ title: z.string(), text: z.string() }))
    .min(2)
    .max(4)
    .optional(),
  /** Paragraphes ou listes (règle du jeu, objectifs…). */
  sections: z
    .array(
      z.object({
        heading: z.string(),
        text: z.string().optional(),
        bullets: z.array(z.string()).max(5).optional(),
      }),
    )
    .max(2)
    .default([]),
  /** Œuvres de référence (films, tableaux, jeux). */
  references: z
    .array(z.object({ title: z.string(), kind: z.string(), note: z.string() }))
    .max(4)
    .optional(),
  /** Tableau de réglages, lu directement par le code du jeu. */
  tuning: z
    .object({
      title: z.string(),
      /** D'où le jeu lit ces valeurs (fichier, outil). */
      source: z.string(),
      /** En-têtes des trois colonnes (un tableau de tri, par exemple). */
      columns: z
        .tuple([z.string(), z.string(), z.string()])
        .default(['Réglage', 'Valeur', 'Pourquoi']),
      rows: z
        .array(
          z.object({
            param: z.string(),
            value: z.string(),
            /** Ancienne valeur, si elle vient de changer. */
            before: z.string().optional(),
            note: z.string().optional(),
          }),
        )
        .min(2)
        .max(7),
    })
    .optional(),
  /** Commentaires dans la marge (discussion entre collègues). */
  comments: z
    .array(
      z.object({
        /** Espace du carnet (le jeu), en tête du sommaire. */
        space: z.string().default('Brume'),
        author: z.string(),
        text: z.string(),
        reply: z.object({ author: z.string(), text: z.string() }).optional(),
        resolved: z.boolean().optional(),
      }),
    )
    .max(3)
    .default([]),
  /** Barre d'état. */
  status: z.string(),
})

export type DesignDocProps = z.infer<typeof designDocPropsSchema>

/** Zones présentes selon les blocs fournis. */
export function designDocZones(p: DesignDocProps): string[] {
  return [
    'outline',
    ...(p.pillars ? ['pillars'] : []),
    ...(p.sections.length ? ['sections'] : []),
    ...(p.references ? ['references'] : []),
    ...(p.tuning ? ['tuning'] : []),
    ...(p.comments.length ? ['comments'] : []),
  ]
}
