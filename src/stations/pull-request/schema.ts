import { z } from 'zod'

const diffLine = z.object({
  /** `+` ligne ajoutée, `-` ligne supprimée, ` ` ligne inchangée (contexte). */
  t: z.enum(['+', '-', ' ']),
  text: z.string(),
  /** Numéro de ligne affiché (dans la nouvelle version, ou l'ancienne pour `-`). */
  n: z.number().int().positive().optional(),
})

const comment = z.object({
  author: z.string(),
  when: z.string(),
  text: z.string(),
})

export const pullRequestPropsSchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  authors: z.array(z.string()).min(1),
  branch: z.string(),
  base: z.string(),
  commits: z.number().int().positive(),
  description: z.string(),
  changedFiles: z.array(
    z.object({ path: z.string(), additions: z.number().int(), deletions: z.number().int() }),
  ),
  /** Extraits de différences affichés dans « Fichiers modifiés ». */
  diffs: z
    .array(
      z.object({
        path: z.string(),
        hunk: z.string(),
        lines: z.array(diffLine).min(1),
        /** Commentaire en ligne, placé après la ligne d'index `after` de cet extrait. */
        inlineComment: z
          .object({
            after: z.number().int().nonnegative(),
            thread: z.array(comment).min(1),
            /** Suggestion de modification (ancienne ligne → nouvelle ligne). */
            suggestion: z.object({ from: z.string(), to: z.string() }).optional(),
            resolved: z.boolean(),
          })
          .optional(),
      }),
    )
    .min(1),
  /** Discussion générale (onglet « Conversation »). */
  timeline: z.array(comment),
  checks: z.array(z.object({ label: z.string(), detail: z.string() })),
  reviewers: z.array(
    z.object({ name: z.string(), state: z.enum(['approved', 'pending', 'changes']) }),
  ),
  /** Message affiché après « Fusionner » (mode interactif). */
  mergedMessage: z.string(),
})

export type PullRequestProps = z.infer<typeof pullRequestPropsSchema>

/** Zones disponibles pour les pastilles. */
export const PULL_REQUEST_ZONES = [
  'pr-header',
  'description',
  'timeline',
  'changed-files',
  'diff',
  'inline-comment',
  'checks',
  'approval',
] as const

/** Zones qui n'existent que dans l'onglet « Fichiers modifiés ». */
export const FILES_TAB_ZONES: readonly string[] = ['changed-files', 'diff', 'inline-comment']
/** Zones qui n'existent que dans l'onglet « Conversation ». */
export const CONVERSATION_TAB_ZONES: readonly string[] = ['description', 'timeline']
