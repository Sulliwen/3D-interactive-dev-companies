import { defineScreen } from '../types'
import { PeopleScreen } from './PeopleScreen'
import { PEOPLE_ZONES, peoplePropsSchema } from './schema'

export const screen = defineScreen({
  component: PeopleScreen,
  props: peoplePropsSchema,
  zones: () => [...PEOPLE_ZONES],
})
