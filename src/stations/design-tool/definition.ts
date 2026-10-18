import { defineScreen } from '../types'
import { DesignToolScreen } from './DesignToolScreen'
import { DESIGN_TOOL_ZONES, designToolPropsSchema } from './schema'

export const screen = defineScreen({
  component: DesignToolScreen,
  props: designToolPropsSchema,
  zones: () => [...DESIGN_TOOL_ZONES],
})
