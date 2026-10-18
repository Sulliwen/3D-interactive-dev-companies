import { getVisit } from '../../content/loader'
import { useGameStore } from '../../state/useGameStore'
import { floorPlan } from '../world/floorplan'
import { npcObstaclesFor } from '../world/staging'
import { buildNavGrid, type NavGrid } from './navGrid'

const grids = new Map<string, NavGrid>()

/** Grille de navigation de l'étage pour la visite en cours, calculée au premier usage. */
export function getNavGrid(): NavGrid {
  const key = getVisit(useGameStore.getState().visit).key
  let grid = grids.get(key)
  if (!grid) {
    // Le mobilier et les personnages debout (ils changent de place selon le scénario).
    grid = buildNavGrid({ ...floorPlan, boxes: [...floorPlan.boxes, ...npcObstaclesFor(key)] })
    grids.set(key, grid)
  }
  return grid
}
