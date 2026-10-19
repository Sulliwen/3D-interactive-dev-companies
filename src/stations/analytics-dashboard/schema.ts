import { z } from 'zod'

const status = z.enum(['good', 'warning', 'serious', 'critical'])

export const analyticsDashboardPropsSchema = z.object({
  /** Nom du tableau de bord (titre de la fenêtre). */
  dashboard: z.string(),
  /** Période analysée. */
  period: z.string(),
  /** Chiffres clés (3 ou 4 tuiles). */
  tiles: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        detail: z.string().optional(),
        status: status.optional(),
      }),
    )
    .min(2)
    .max(4),
  /** Évolution dans le temps : une seule série, un seul axe. */
  trend: z.object({
    title: z.string(),
    seriesLabel: z.string(),
    labels: z.array(z.string()).min(2),
    values: z.array(z.number()),
    unit: z.string().default(''),
    /** Haut de l'axe (sinon calculé). */
    yMax: z.number().optional(),
  }),
  /** Répartition (barres). */
  breakdown: z.object({
    title: z.string(),
    valueLabel: z.string(),
    bars: z.array(
      z.object({ label: z.string(), value: z.number(), highlight: z.boolean().optional() }),
    ),
  }),
  /** Comment le chiffre est calculé (requête affichée). */
  query: z.object({ title: z.string(), lines: z.array(z.string()), result: z.string() }),
  /** Projection « et si… ». */
  hypothesis: z.object({ title: z.string(), text: z.string(), value: z.string() }),
  /** Barre d'état : fraîcheur des données, et ce qu'elles ne contiennent pas. */
  freshness: z.string().default('Données mises à jour ce matin à 6 h 00'),
  privacy: z.string().default('Données anonymisées · aucun nom de patient'),
})

export type AnalyticsDashboardProps = z.infer<typeof analyticsDashboardPropsSchema>

export const ANALYTICS_DASHBOARD_ZONES = [
  'tiles',
  'trend',
  'breakdown',
  'query',
  'hypothesis',
] as const
