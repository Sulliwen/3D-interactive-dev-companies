import { defineScreen } from '../types'
import { ModelingViewportScreen } from './ModelingViewportScreen'
import { MODELING_VIEWPORT_ZONES, modelingViewportPropsSchema } from './schema'

export const screen = defineScreen({
  component: ModelingViewportScreen,
  props: modelingViewportPropsSchema,
  zones: () => [...MODELING_VIEWPORT_ZONES],
})
