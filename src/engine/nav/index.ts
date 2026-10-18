import { floorPlan } from '../world/floorplan'
import { npcObstacles } from '../world/npcs'
import { buildNavGrid, type NavGrid } from './navGrid'

let grid: NavGrid | null = null

/** Grille de navigation de l'étage, calculée au premier usage. */
export function getNavGrid(): NavGrid {
  // Le mobilier et les personnages debout.
  grid ??= buildNavGrid({ ...floorPlan, boxes: [...floorPlan.boxes, ...npcObstacles] })
  return grid
}
