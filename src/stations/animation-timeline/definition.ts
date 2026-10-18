import { defineScreen } from '../types'
import { AnimationTimelineScreen } from './AnimationTimelineScreen'
import { ANIMATION_TIMELINE_ZONES, animationTimelinePropsSchema } from './schema'

export const screen = defineScreen({
  component: AnimationTimelineScreen,
  props: animationTimelinePropsSchema,
  zones: () => [...ANIMATION_TIMELINE_ZONES],
})
