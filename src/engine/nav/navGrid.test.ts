import { describe, expect, it } from 'vitest'
import { plan as floorPlan } from '../world/worlds/atelier-lumen/plan'
import { standPoint } from '../stations/standPoint'
import { buildNavGrid, findPath, isFree, lineOfSight, pathLength, toCell } from './navGrid'

const grid = buildNavGrid(floorPlan)

describe('grille de navigation · Atelier Lumen', () => {
  it('le point de départ de la visite est libre', () => {
    const [x, , z] = floorPlan.spawn.position
    expect(isFree(grid, ...toCell(grid, [x, z]))).toBe(true)
  })

  it('le mur Scrum bloque le passage', () => {
    expect(isFree(grid, ...toCell(grid, [0, -0.5]))).toBe(false)
  })

  it('contourne le mur Scrum au lieu de le traverser', () => {
    const path = findPath(grid, [0, 2], [0, -3])!
    expect(path).not.toBeNull()
    expect(path.length).toBeGreaterThan(2)
    for (let i = 1; i < path.length; i++)
      expect(lineOfSight(grid, path[i - 1]!, path[i]!)).toBe(true)
    expect(pathLength(path)).toBeGreaterThan(5)
  })

  it('mène de l’accueil à chaque poste', () => {
    const [x, , z] = floorPlan.spawn.position
    for (const anchor of floorPlan.stations) {
      const path = findPath(grid, [x, z], standPoint(anchor))
      expect(path, `poste ${anchor.number}`).not.toBeNull()
      const end = path![path!.length - 1]!
      // L'arrivée est à portée de l'écran (≤ 2 m, ou le rayon propre du poste).
      const d = Math.hypot(end[0] - anchor.screenPosition[0], end[1] - anchor.screenPosition[2])
      expect(d, `poste ${anchor.number}`).toBeLessThanOrEqual(anchor.interactionRadius ?? 2)
    }
  })
})
