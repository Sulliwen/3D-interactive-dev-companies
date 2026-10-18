import { z } from 'zod'

export const codeEditorPropsSchema = z.object({
  /** Nom du dépôt affiché dans l'explorateur. */
  project: z.string(),
  /** Branche Git affichée dans la barre d'état. */
  branch: z.string(),
  /** Autres fichiers et dossiers visibles dans l'explorateur (décor). */
  explorer: z.array(z.string()),
  files: z
    .array(
      z.object({
        name: z.string(),
        /** Chemin relatif à `src/content/screens/`. */
        source: z.string(),
      }),
    )
    .min(1),
  initialFile: z.number().int().nonnegative().default(0),
  /** Dossier qui contient les fichiers ouverts, dans l'explorateur. */
  folder: z.string().default('appointments'),
  /** Simulateur de téléphone affiché à droite de l'éditeur (front-end mobile). */
  preview: z
    .object({
      kind: z.literal('phone'),
      /** Titre du panneau (ex. « Simulateur · iPhone 15 »). */
      title: z.string(),
      state: z.enum(['appointments', 'confirm', 'cancelled', 'too-late']).default('appointments'),
      /** Ce que donne « Oui, annuler » dans le simulateur. */
      outcome: z.enum(['cancelled', 'too-late']).default('cancelled'),
      when: z.string().optional(),
      caption: z.string().optional(),
    })
    .optional(),
  terminal: z.object({
    command: z.string(),
    lines: z.array(
      z.object({ kind: z.enum(['info', 'pass', 'fail', 'summary']), text: z.string() }),
    ),
  }),
})

export type CodeEditorProps = z.infer<typeof codeEditorPropsSchema>

/** Zones toujours présentes à l'écran, en plus des zones déclarées dans le code. */
export const CODE_EDITOR_FIXED_ZONES = ['terminal', 'explorer', 'tabs'] as const

/** Zone du simulateur, présente seulement quand `preview` est défini. */
export const CODE_EDITOR_PREVIEW_ZONE = 'preview'
