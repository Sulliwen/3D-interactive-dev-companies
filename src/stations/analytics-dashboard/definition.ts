import { defineScreen } from '../types'
import { AnalyticsDashboardScreen } from './AnalyticsDashboardScreen'
import { ANALYTICS_DASHBOARD_ZONES, analyticsDashboardPropsSchema } from './schema'

export const screen = defineScreen({
  component: AnalyticsDashboardScreen,
  props: analyticsDashboardPropsSchema,
  zones: () => [...ANALYTICS_DASHBOARD_ZONES],
})
