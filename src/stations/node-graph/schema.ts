import { z } from 'zod'

const port = z.string()

export const nodeGraphPropsSchema = z.object({
  /** Document ouvert (ex. « Brume_Fog · graphe de shader »). */
  title: z.string(),
  /** Nœuds du graphe (largeur 136 px), placés en pixels dans le canevas (environ 640 × 480). */
  nodes: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        kind: z.enum(['input', 'texture', 'math', 'output']),
        x: z.number(),
        y: z.number(),
        inputs: z.array(port).default([]),
        outputs: z.array(port).default([]),
        /** Petite valeur affichée dans le nœud (« 6 m », « échelle 0,3 »…). */
        value: z.string().optional(),
        /** Coût du nœud, affiché en pied (« 0,4 ms »). */
        cost: z.string().optional(),
        /** Nœud retiré pour tenir le budget : barré, en pointillés. */
        removed: z.boolean().optional(),
        /** Zone de pastille regroupant ce nœud (et les autres nœuds de même zone). */
        zone: z.string().optional(),
      }),
    )
    .min(2),
  /** Liens : de la sortie `fromPort` d'un nœud à l'entrée `toPort` d'un autre. */
  links: z.array(
    z.object({
      from: z.string(),
      fromPort: z.number().int().nonnegative().default(0),
      to: z.string(),
      toPort: z.number().int().nonnegative().default(0),
    }),
  ),
  preview: z.object({
    title: z.string(),
    caption: z.string(),
  }),
  cost: z.object({
    title: z.string(),
    /** Budget de l'effet, en ms par image. */
    budget: z.number().positive(),
    before: z.object({ label: z.string(), ms: z.number().nonnegative() }),
    after: z.object({ label: z.string(), ms: z.number().nonnegative() }),
    note: z.string(),
  }),
  /** Paramètres exposés au reste du jeu (lus ou écrits par le code). */
  parameters: z.array(z.object({ name: z.string(), value: z.string(), note: z.string() })),
  statusItems: z.array(z.string()).default([]),
})

export type NodeGraphProps = z.infer<typeof nodeGraphPropsSchema>

/** Zones toujours présentes, en plus des zones déclarées sur les nœuds. */
export const NODE_GRAPH_ZONES = ['preview', 'cost', 'parameters'] as const
