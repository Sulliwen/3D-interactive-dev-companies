import type { TourShot } from '../../camera/screenPose'
import type { BackdropSpec } from '../CityBackdrop'
import type { FloorPlan } from '../floorplan'
import type { NpcPlacement } from '../npcs'
import type { Staging } from '../staging'

/**
 * Un monde : l'étage d'une structure. Son plan, ses habitants et la mise en scène de
 * chaque scénario. Ses modèles 3D sont dans public/models/<id>/ (`npm run art:build`) et
 * ne sont téléchargés qu'une fois la structure choisie.
 */
export interface WorldDef {
  id: string
  plan: FloorPlan
  /** Les titulaires des postes, à leur bureau quel que soit le scénario. */
  stationNpcs: NpcPlacement[]
  /** Figurants par défaut (café, réunion…), quand le scénario n'en prévoit pas d'autres. */
  figurants: NpcPlacement[]
  /** Mise en scène propre à chaque scénario (clé : structure/scénario). */
  staging: Record<string, Staging>
  /** Ouverture de la présentation : vue d'ensemble de l'étage. */
  overview: TourShot
  /** Ce qu'on voit par les fenêtres. */
  backdrop: BackdropSpec
}
