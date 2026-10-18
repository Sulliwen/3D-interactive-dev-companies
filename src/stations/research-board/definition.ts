import { defineScreen } from '../types'
import { ResearchBoardScreen } from './ResearchBoardScreen'
import { RESEARCH_BOARD_ZONES, researchBoardPropsSchema } from './schema'

export const screen = defineScreen({
  component: ResearchBoardScreen,
  props: researchBoardPropsSchema,
  zones: () => [...RESEARCH_BOARD_ZONES],
})
