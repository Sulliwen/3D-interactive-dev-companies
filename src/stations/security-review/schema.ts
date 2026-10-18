import { z } from 'zod'

const zoneId = z.string().regex(/^[a-z0-9-]+$/)

export const securityReviewPropsSchema = z.object({
  /** Fonctionnalité relue (ex. « PS-142 · Annulation d'un rendez-vous »). */
  feature: z.string(),
  reviewer: z.string(),
  /** Groupes de la liste de contrôle ; chaque groupe est une zone de pastille. */
  checklist: z
    .array(
      z.object({
        zone: zoneId,
        title: z.string(),
        items: z.array(
          z.object({
            label: z.string(),
            state: z.enum(['done', 'in-progress', 'todo']),
            note: z.string().optional(),
          }),
        ),
      }),
    )
    .min(1),
  /** Vérification « seul le patient peut annuler son rendez-vous ». */
  accessCheck: z.object({
    title: z.string(),
    source: z.string(),
    code: z.array(z.string()).min(1),
    result: z.string(),
  }),
  dependencies: z.array(
    z.object({
      name: z.string(),
      version: z.string(),
      severity: z.enum(['none', 'medium', 'high']),
      /** Version corrigée, si une mise à jour est nécessaire. */
      fixedIn: z.string().optional(),
      note: z.string(),
    }),
  ),
  auditLog: z.array(
    z.object({
      time: z.string(),
      event: z.string(),
      actor: z.string(),
      resource: z.string(),
      result: z.enum(['ok', 'denied']),
    }),
  ),
})

export type SecurityReviewProps = z.infer<typeof securityReviewPropsSchema>

export const SECURITY_REVIEW_FIXED_ZONES = [
  'security-header',
  'ownership',
  'dependencies',
  'audit-log',
] as const
