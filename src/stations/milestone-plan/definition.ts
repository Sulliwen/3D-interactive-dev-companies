import { defineScreen } from '../types'
import { MilestonePlanScreen } from './MilestonePlanScreen'
import { MILESTONE_PLAN_ZONES, milestonePlanPropsSchema } from './schema'

export const screen = defineScreen({
  component: MilestonePlanScreen,
  props: milestonePlanPropsSchema,
  zones: () => [...MILESTONE_PLAN_ZONES],
})
