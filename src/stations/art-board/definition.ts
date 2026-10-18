import { defineScreen } from '../types'
import { ArtBoardScreen } from './ArtBoardScreen'
import { ART_BOARD_ZONES, artBoardPropsSchema } from './schema'

export const screen = defineScreen({
  component: ArtBoardScreen,
  props: artBoardPropsSchema,
  zones: () => [...ART_BOARD_ZONES],
})
