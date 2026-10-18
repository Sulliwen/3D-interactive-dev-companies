import { z } from 'zod'

const phoneState = z.enum(['appointments', 'confirm', 'cancelled', 'too-late'])

export const designToolPropsSchema = z.object({
  /** Nom du fichier de maquettes (barre de titre). */
  file: z.string(),
  /** Pages du fichier (panneau de gauche) ; la première est ouverte. */
  pages: z.array(z.string()).min(1),
  /** Initiales des personnes connectées au fichier. */
  collaborators: z.array(z.string()),
  /** Les 4 maquettes du parcours, dans l'ordre : liste, confirmation, succès, refus. */
  frames: z
    .array(z.object({ state: phoneState, caption: z.string(), when: z.string().optional() }))
    .length(4),
  /** Libellés des flèches du parcours. */
  flow: z.object({ toConfirm: z.string(), toDone: z.string(), toTooLate: z.string() }),
  components: z.array(
    z.object({
      name: z.string(),
      kind: z.enum(['danger', 'secondary', 'card']),
      label: z.string(),
    }),
  ),
  colors: z.array(z.object({ name: z.string(), hex: z.string() })),
  typography: z.array(z.object({ name: z.string(), spec: z.string() })),
  accessibility: z.array(z.object({ label: z.string(), value: z.string(), ok: z.boolean() })),
  comment: z.object({ author: z.string(), initials: z.string(), text: z.string() }),
  prototype: z.object({ title: z.string(), hint: z.string() }),
})

export type DesignToolProps = z.infer<typeof designToolPropsSchema>

export const DESIGN_TOOL_ZONES = [
  'frames',
  'flow',
  'components',
  'accessibility',
  'prototype',
  'comment',
] as const
