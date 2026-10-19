import { defineScreen } from '../types'
import { CrashReportsScreen } from './CrashReportsScreen'
import { CRASH_REPORTS_ZONES, crashReportsPropsSchema } from './schema'

export const screen = defineScreen({
  component: CrashReportsScreen,
  props: crashReportsPropsSchema,
  zones: () => [...CRASH_REPORTS_ZONES],
})
