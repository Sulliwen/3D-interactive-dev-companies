import { z } from 'zod'

export const localizationPropsSchema = z.object({
  /** Fichier ou vue ouverte (barre de titre). */
  file: z.string(),
  /** Volume du texte source. */
  totals: z.object({ words: z.number().int().positive(), strings: z.number().int().positive() }),
  /** Langues du jeu : avancement, type de relecture, problèmes ouverts. */
  languages: z
    .array(
      z.object({
        code: z.string().min(2).max(5),
        name: z.string(),
        /** Avancement de la traduction, en %. */
        progress: z.number().min(0).max(100),
        review: z.string(),
        source: z.boolean().optional(),
        issues: z.number().int().nonnegative().default(0),
      }),
    )
    .min(3)
    .max(10),
  /** Table des textes : source et langue cible, avec la longueur maximale permise. */
  table: z.object({
    target: z.string(),
    rows: z
      .array(
        z.object({
          id: z.string(),
          source: z.string(),
          target: z.string(),
          /** Nombre de caractères que la bulle ou le bouton peut afficher. */
          limit: z.number().int().positive(),
        }),
      )
      .min(2)
      .max(7),
  }),
  /** Aperçu dans le jeu de la ligne qui déborde, et la correction proposée. */
  bubble: z.object({
    rowId: z.string(),
    speaker: z.string(),
    fix: z.string(),
    fixNote: z.string(),
  }),
  /** Relecture par des testeurs natifs. */
  review: z
    .array(z.object({ lang: z.string(), who: z.string(), result: z.string() }))
    .min(1)
    .max(3),
  /** Une réplique adaptée plutôt que traduite mot à mot. */
  humour: z.object({
    lang: z.string(),
    source: z.string(),
    literal: z.string(),
    adapted: z.string(),
    note: z.string(),
  }),
  footer: z.string(),
})

export type LocalizationProps = z.infer<typeof localizationPropsSchema>

export const LOCALIZATION_ZONES = ['languages', 'strings', 'bubble', 'review', 'humour'] as const
