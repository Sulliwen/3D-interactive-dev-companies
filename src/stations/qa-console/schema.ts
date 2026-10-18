import { z } from 'zod'

export const qaConsolePropsSchema = z.object({
  /** Campagne de tests (barre de titre). */
  campaign: z.string(),
  /** Texte de la barre d'état. */
  status: z.string(),
  /** Titres des deux cartes de gauche (jeu vidéo : « Tests du build », « Plan de test »…). */
  autoTitle: z.string().default('Tests automatiques'),
  planTitle: z.string().default('Recette manuelle'),
  /** Tests automatiques, par famille (dans l'ordre des couleurs de série). */
  suites: z.array(z.object({ label: z.string(), passed: z.number(), total: z.number() })).max(3),
  /** Plan de recette manuelle. `edge` : cas limite (regroupés sous une même pastille). */
  cases: z.array(
    z.object({
      label: z.string(),
      device: z.string(),
      result: z.enum(['pass', 'fail']),
      edge: z.boolean().default(false),
      bug: z.string().optional(),
    }),
  ),
  bug: z.object({
    id: z.string(),
    title: z.string(),
    severity: z.string(),
    device: z.string(),
    steps: z.array(z.string()).min(1),
    expected: z.string(),
    actual: z.string(),
    /** Cause trouvée par l'équipe, avec l'extrait de code fautif et corrigé. */
    cause: z.object({ text: z.string(), before: z.string(), after: z.string() }),
    assignee: z.string(),
    /** Statut avant / après le nouveau test. */
    statusBefore: z.string(),
    statusAfter: z.string(),
    retestLabel: z.string(),
    /** Date affichée sur la capture du téléphone Pocket Santé (sans elle : pas de capture). */
    when: z.string().optional(),
    caption: z.string().optional(),
  }),
})

export type QaConsoleProps = z.infer<typeof qaConsolePropsSchema>

export const QA_CONSOLE_ZONES = [
  'auto-tests',
  'manual-plan',
  'edge-cases',
  'bug-report',
  'bug-cause',
  'retest',
] as const
