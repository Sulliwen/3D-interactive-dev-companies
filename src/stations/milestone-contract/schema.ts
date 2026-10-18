import { z } from 'zod'

export const milestoneContractPropsSchema = z.object({
  /** Contrat (barre de titre). */
  contract: z.string(),
  status: z.string(),
  /** Le jalon en cours : nom, date et lieu, interlocutrice chez l'éditeur. */
  milestone: z.object({ title: z.string(), when: z.string(), contact: z.string() }),
  /** Échéancier : chaque jalon validé déclenche un versement. */
  payments: z
    .array(
      z.object({
        label: z.string(),
        date: z.string(),
        /** En euros. */
        amount: z.number().nonnegative(),
        state: z.enum(['paid', 'current', 'upcoming']),
      }),
    )
    .min(2),
  /** Livrables du jalon : qui s'en charge, et s'ils sont prêts. */
  deliverables: z
    .array(z.object({ label: z.string(), owner: z.string(), done: z.boolean() }))
    .min(1)
    .max(6),
  /** Critères d'acceptation écrits dans le contrat. */
  criteria: z.array(z.string()).min(1).max(5),
  /** Comment l'avance est remboursée (texte court, et le partage des recettes). */
  recoup: z.object({
    text: z.string(),
    shares: z
      .array(z.object({ label: z.string(), studio: z.number().min(0).max(100) }))
      .min(1)
      .max(3),
  }),
  /** Prochain rendez-vous public (salon, démo presse…). */
  next: z.object({ title: z.string(), when: z.string(), text: z.string() }),
})

export type MilestoneContractProps = z.infer<typeof milestoneContractPropsSchema>

export const MILESTONE_CONTRACT_ZONES = [
  'payments',
  'deliverables',
  'criteria',
  'recoup',
  'next',
] as const
