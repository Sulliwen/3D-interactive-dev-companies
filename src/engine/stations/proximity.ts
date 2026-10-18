import type { StationAnchor, Vec2 } from '../world/floorplan'

export const INTERACTION_RADIUS = 2

/**
 * Poste le plus proche à portée, en ne retenant que les écrans dont on voit la face
 * avant (on ne « regarde » pas un écran depuis derrière l'îlot).
 */
export function findNearbyStation(
  player: Vec2,
  anchors: readonly StationAnchor[],
  radius = INTERACTION_RADIUS,
): number | null {
  let best: number | null = null
  let bestDist = Infinity
  for (const a of anchors) {
    const dx = player[0] - a.screenPosition[0]
    const dz = player[1] - a.screenPosition[2]
    const dist = Math.hypot(dx, dz)
    if (dist > (a.interactionRadius ?? radius) || dist >= bestDist) continue
    const inFront = dx * Math.sin(a.screenRotationY) + dz * Math.cos(a.screenRotationY) > 0
    if (!inFront) continue
    best = a.number
    bestDist = dist
  }
  return best
}
