import { defineScreen } from '../types'
import { DialogueGraphScreen } from './DialogueGraphScreen'
import { dialogueGraphPropsSchema, dialogueGraphZones } from './schema'

export const screen = defineScreen({
  component: DialogueGraphScreen,
  props: dialogueGraphPropsSchema,
  zones: dialogueGraphZones,
})
