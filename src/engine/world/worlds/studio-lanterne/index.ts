import { stationPlacement } from '../../npcs'
import type { WorldDef } from '../types'
import { figurants, stationPeople } from './people'
import { plan } from './plan'
import { staging } from './staging'

export const studioLanterne: WorldDef = {
  id: 'studio-lanterne',
  plan,
  stationNpcs: stationPeople.map((p) => stationPlacement(plan, p)),
  figurants,
  staging,
  overview: { position: [-9.2, 3.1, 8.8], target: [3, 0.8, -4] },
  // Rez-de-chaussée des Chartrons : de l'autre côté de la rue, des immeubles bas en pierre.
  backdrop: {
    groundY: -0.05,
    ground: '#8d8a82',
    near: 21,
    rows: 3,
    rowGap: 18,
    height: [9, 7],
    tints: ['#e3d9c3', '#d8cbb0', '#e8e1d0', '#cdbf9f'],
    facade: { wall: '#e6dcc6', glass: ['#6d7b84', '#47545c'] },
  },
}
