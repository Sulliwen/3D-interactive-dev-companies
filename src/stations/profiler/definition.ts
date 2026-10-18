import { defineScreen } from '../types'
import { ProfilerScreen } from './ProfilerScreen'
import { PROFILER_ZONES, profilerPropsSchema } from './schema'

export const screen = defineScreen({
  component: ProfilerScreen,
  props: profilerPropsSchema,
  zones: () => [...PROFILER_ZONES],
})
