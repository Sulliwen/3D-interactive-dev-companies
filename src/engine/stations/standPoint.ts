import type { StationAnchor, Vec2 } from '../world/floorplan'

/** Où se tenir pour regarder un écran : devant lui, à distance de lecture. */
export function standPoint(anchor: StationAnchor, distance = 1.35): Vec2 {
  const d = anchor.interactionRadius
    ? Math.min(distance + 0.4, anchor.interactionRadius - 0.5)
    : distance
  return [
    anchor.screenPosition[0] + Math.sin(anchor.screenRotationY) * d,
    anchor.screenPosition[2] + Math.cos(anchor.screenRotationY) * d,
  ]
}
