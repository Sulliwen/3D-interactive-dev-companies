import { z } from 'zod'

const node = z.object({
  id: z.string(),
  /** Réplique d'un personnage, choix du joueur, condition, ou événement de jeu. */
  kind: z.enum(['line', 'choice', 'condition', 'event']),
  speaker: z.string().optional(),
  text: z.string(),
  /** Position dans le graphe, en pixels (nœuds de 140 × 58, zone de 670 × 450). */
  x: z.number().min(0).max(520),
  y: z.number().min(0).max(390),
  /** Fichier de voix et jeu demandé à la comédienne. */
  voice: z.object({ id: z.string(), direction: z.string(), duration: z.string() }).optional(),
  /** Zone de pastille posée sur ce nœud. */
  zone: z.string().optional(),
})

export const dialogueGraphPropsSchema = z.object({
  /** Scène ouverte (titre de la fenêtre). */
  scene: z.string(),
  nodes: z.array(node).min(3).max(12),
  edges: z.array(z.object({ from: z.string(), to: z.string(), label: z.string().optional() })),
  /** Nœud sélectionné à l'ouverture (inspecteur). */
  selected: z.string(),
  /** Variables de l'histoire lues ou modifiées par la scène. */
  variables: z.array(z.object({ name: z.string(), value: z.string() })).max(4),
  recording: z.object({
    lines: z.number().int().positive(),
    written: z.number().int().nonnegative(),
    date: z.string(),
    actor: z.string(),
  }),
  status: z.string(),
})

export type DialogueGraphProps = z.infer<typeof dialogueGraphPropsSchema>

export function dialogueGraphZones(p: DialogueGraphProps): string[] {
  return ['graph', 'inspector', 'recording', ...p.nodes.flatMap((n) => (n.zone ? [n.zone] : []))]
}
