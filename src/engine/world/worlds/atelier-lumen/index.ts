import { stationPlacement } from '../../npcs'
import type { WorldDef } from '../types'
import { figurants, stationPeople } from './people'
import { plan } from './plan'
import { staging } from './staging'

export const atelierLumen: WorldDef = {
  id: 'atelier-lumen',
  plan,
  stationNpcs: stationPeople.map((p) => stationPlacement(plan, p)),
  figurants,
  staging,
}
