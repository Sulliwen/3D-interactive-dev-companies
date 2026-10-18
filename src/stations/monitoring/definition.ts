import { defineScreen } from '../types'
import { MonitoringScreen } from './MonitoringScreen'
import { MONITORING_ZONES, monitoringPropsSchema } from './schema'

export const screen = defineScreen({
  component: MonitoringScreen,
  props: monitoringPropsSchema,
  zones: () => [...MONITORING_ZONES],
})
