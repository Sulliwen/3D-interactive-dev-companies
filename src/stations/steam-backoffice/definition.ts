import { defineScreen } from '../types'
import { SteamBackofficeScreen } from './SteamBackofficeScreen'
import { STEAM_BACKOFFICE_ZONES, steamBackofficePropsSchema } from './schema'

export const screen = defineScreen({
  component: SteamBackofficeScreen,
  props: steamBackofficePropsSchema,
  zones: () => [...STEAM_BACKOFFICE_ZONES],
})
