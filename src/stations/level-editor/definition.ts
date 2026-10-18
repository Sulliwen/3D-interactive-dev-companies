import { defineScreen } from '../types'
import { LevelEditorScreen } from './LevelEditorScreen'
import { LEVEL_EDITOR_ZONES, levelEditorPropsSchema } from './schema'

export const screen = defineScreen({
  component: LevelEditorScreen,
  props: levelEditorPropsSchema,
  zones: () => [...LEVEL_EDITOR_ZONES],
})
