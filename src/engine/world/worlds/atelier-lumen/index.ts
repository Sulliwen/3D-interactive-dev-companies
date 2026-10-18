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
  overview: { position: [9.6, 2.5, 8.6], target: [-3, 0.6, -3] },
  // L'étage est au 9e : le sol de la ville est bien plus bas que le plancher.
  backdrop: {
    groundY: -30,
    ground: '#9aa29a',
    near: 48,
    rows: 4,
    rowGap: 26,
    height: [12, 50],
    tints: ['#c8ccd2', '#b7bec8', '#d6d2cb', '#a9b3bf', '#e0ddd6'],
    facade: { wall: '#e4e2dd', glass: ['#7f93a6', '#4f6172'] },
  },
}
