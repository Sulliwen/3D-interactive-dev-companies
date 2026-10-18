import { defineScreen } from '../types'
import { PlaytestLabScreen } from './PlaytestLabScreen'
import { PLAYTEST_LAB_ZONES, playtestLabPropsSchema } from './schema'

export const screen = defineScreen({
  component: PlaytestLabScreen,
  props: playtestLabPropsSchema,
  zones: () => [...PLAYTEST_LAB_ZONES],
})
