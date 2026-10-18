import { defineScreen } from '../types'
import { QaConsoleScreen } from './QaConsoleScreen'
import { QA_CONSOLE_ZONES, qaConsolePropsSchema } from './schema'

export const screen = defineScreen({
  component: QaConsoleScreen,
  props: qaConsolePropsSchema,
  zones: () => [...QA_CONSOLE_ZONES],
})
