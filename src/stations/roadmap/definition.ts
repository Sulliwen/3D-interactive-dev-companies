import { defineScreen } from '../types'
import { RoadmapScreen } from './RoadmapScreen'
import { ROADMAP_ZONES, roadmapPropsSchema } from './schema'

export const screen = defineScreen({
  component: RoadmapScreen,
  props: roadmapPropsSchema,
  zones: () => [...ROADMAP_ZONES],
})
