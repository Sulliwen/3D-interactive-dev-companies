import { defineScreen } from '../types'
import { BacklogScreen } from './BacklogScreen'
import { BACKLOG_ZONES, backlogPropsSchema } from './schema'

export const screen = defineScreen({
  component: BacklogScreen,
  props: backlogPropsSchema,
  zones: () => [...BACKLOG_ZONES],
})
