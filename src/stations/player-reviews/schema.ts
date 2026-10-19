import { z } from 'zod'

export const playerReviewsPropsSchema = z.object({
  /** Vue ouverte (ex. « Brume · premiers avis »). */
  title: z.string(),
  /** Moment du relevé, à droite de la barre de titre. */
  period: z.string(),
  /** Avis des joueurs sur la boutique : pour ou contre, et l'appréciation qui en découle. */
  summary: z.object({
    percent: z.number().min(0).max(100),
    label: z.string(),
    positive: z.number().int().nonnegative(),
    negative: z.number().int().nonnegative(),
    detail: z.string(),
  }),
  /** Notes de la presse (tests publiés à la levée de l'embargo). */
  press: z.object({
    score: z.number().min(0).max(100),
    count: z.number().int().positive(),
    source: z.string(),
    quotes: z
      .array(z.object({ outlet: z.string(), score: z.string(), text: z.string() }))
      .max(3)
      .default([]),
  }),
  /** Sujets qui reviennent dans les avis : nombre de mentions, part de mentions positives. */
  themes: z
    .array(
      z.object({
        label: z.string(),
        mentions: z.number().int().nonnegative(),
        positive: z.number().min(0).max(1),
        note: z.string().optional(),
      }),
    )
    .min(3)
    .max(6),
  /** Quelques avis, avec la réponse publique de l'équipe. */
  reviews: z
    .array(
      z.object({
        author: z.string(),
        hours: z.string(),
        recommended: z.boolean(),
        text: z.string(),
        reply: z.object({ author: z.string(), text: z.string() }).optional(),
      }),
    )
    .min(2)
    .max(3),
  /** Ce que l'équipe en retient pour les prochaines versions. */
  roadmap: z.object({
    title: z.string(),
    items: z
      .array(z.object({ text: z.string(), when: z.string() }))
      .min(2)
      .max(4),
  }),
  statusItems: z.array(z.string()).default([]),
})

export type PlayerReviewsProps = z.infer<typeof playerReviewsPropsSchema>

export const PLAYER_REVIEWS_ZONES = ['summary', 'press', 'themes', 'reviews', 'roadmap'] as const
