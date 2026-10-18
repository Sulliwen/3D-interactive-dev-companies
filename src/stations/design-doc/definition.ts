import { defineScreen } from '../types'
import { DesignDocScreen } from './DesignDocScreen'
import { designDocPropsSchema, designDocZones } from './schema'

export const screen = defineScreen({
  component: DesignDocScreen,
  props: designDocPropsSchema,
  zones: designDocZones,
})
