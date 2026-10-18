import { defineScreen } from '../types'
import { TicketDeskScreen } from './TicketDeskScreen'
import { TICKET_DESK_ZONES, ticketDeskPropsSchema } from './schema'

export const screen = defineScreen({
  component: TicketDeskScreen,
  props: ticketDeskPropsSchema,
  zones: () => [...TICKET_DESK_ZONES],
})
