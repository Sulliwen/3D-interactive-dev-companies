import { z } from 'zod'

export const ticketDeskPropsSchema = z.object({
  /** Filtres affichés au-dessus de la boîte de réception. */
  filters: z.array(z.object({ label: z.string(), count: z.number() })),
  inbox: z
    .array(
      z.object({
        id: z.string(),
        from: z.string(),
        subject: z.string(),
        tag: z.string(),
        time: z.string(),
        unread: z.boolean().default(false),
      }),
    )
    .min(1),
  /** Ticket ouvert (id présent dans `inbox`). */
  ticket: z.object({
    id: z.string(),
    subject: z.string(),
    messages: z.array(
      z.object({
        author: z.string(),
        kind: z.enum(['patient', 'agent', 'note']),
        time: z.string(),
        text: z.string(),
      }),
    ),
    reply: z.string(),
  }),
  /** Barre d'état : file, délai moyen, satisfaction. */
  status: z
    .object({ queue: z.string(), firstReply: z.string(), satisfaction: z.string() })
    .default({ queue: 'Patients', firstReply: '3 h 40', satisfaction: '4,6 / 5' }),
  customer: z.object({
    /** Type de contact affiché au-dessus du nom (« Patient·e », « Cabinet »…). */
    kind: z.string().default('Patient·e'),
    name: z.string(),
    details: z.array(z.object({ label: z.string(), value: z.string() })),
    tags: z.array(z.string()),
  }),
  /** Motifs de contact du mois (le premier est mis en avant). */
  reasons: z.object({
    title: z.string(),
    items: z.array(z.object({ label: z.string(), count: z.number() })).min(1),
    note: z.string(),
  }),
  escalation: z.object({
    action: z.string(),
    done: z.string(),
  }),
})

export type TicketDeskProps = z.infer<typeof ticketDeskPropsSchema>

export const TICKET_DESK_ZONES = [
  'inbox',
  'conversation',
  'note',
  'tags',
  'reasons',
  'escalation',
] as const
