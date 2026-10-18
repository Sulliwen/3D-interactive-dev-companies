import { getVisit } from '../../content/loader'
import { useGameStore } from '../../state/useGameStore'
import { npcObstaclesFor } from '../world/staging'
import { worldOf } from '../world/worlds'
import { buildNavGrid, type NavGrid } from './navGrid'

const grids = new Map<string, NavGrid>()

/** Grille de navigation de l'étage pour la visite en cours, calculée au premier usage. */
export function getNavGrid(): NavGrid {
  const visit = getVisit(useGameStore.getState().visit)
  const key = visit.key
  let grid = grids.get(key)
  if (!grid) {
    const floorPlan = worldOf(visit.structure.id).plan
    // Le mobilier et les personnages debout (ils changent de place selon le scénario).
    grid = buildNavGrid({ ...floorPlan, boxes: [...floorPlan.boxes, ...npcObstaclesFor(key)] })
    grids.set(key, grid)
  }
  return grid
}
