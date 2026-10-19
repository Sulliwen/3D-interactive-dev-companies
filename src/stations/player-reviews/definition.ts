import { defineScreen } from '../types'
import { PlayerReviewsScreen } from './PlayerReviewsScreen'
import { PLAYER_REVIEWS_ZONES, playerReviewsPropsSchema } from './schema'

export const screen = defineScreen({
  component: PlayerReviewsScreen,
  props: playerReviewsPropsSchema,
  zones: () => [...PLAYER_REVIEWS_ZONES],
})
