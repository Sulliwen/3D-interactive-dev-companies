import { defineScreen } from '../types'
import { SprintBoardScreen } from './SprintBoardScreen'
import { SPRINT_BOARD_FIXED_ZONES, sprintBoardPropsSchema } from './schema'

export const screen = defineScreen({
  component: SprintBoardScreen,
  props: sprintBoardPropsSchema,
  zones: (props) => [
    ...SPRINT_BOARD_FIXED_ZONES,
    ...props.columns.flatMap((c) => c.cards.flatMap((card) => (card.zone ? [card.zone] : []))),
  ],
})
