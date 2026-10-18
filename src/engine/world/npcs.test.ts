import { describe, expect, it } from 'vitest'
import { floorPlan } from './floorplan'
import { npcObstacles, npcs } from './npcs'
import { buildNavGrid, findPath, isFree, toCell } from '../nav/navGrid'
import { standPoint } from '../stations/standPoint'

describe('personnages', () => {
  it('chaque poste du fil rouge a son titulaire', () => {
    const stations = new Set(npcs.map((n) => n.station).filter(Boolean))
    for (let n = 1; n <= 14; n++) expect(stations.has(n), `poste ${n}`).toBe(true)
  })

  it('identifiants uniques', () => {
    expect(new Set(npcs.map((n) => n.id)).size).toBe(npcs.length)
  })

  it('tout le monde est dans l’étage', () => {
    for (const n of npcs) {
      expect(Math.abs(n.position[0]), n.id).toBeLessThan(floorPlan.width / 2 - 0.2)
      expect(Math.abs(n.position[1]), n.id).toBeLessThan(floorPlan.depth / 2 - 0.2)
    }
  })

  it('les personnages assis sont devant leur écran, à moins d’un mètre', () => {
    for (const n of npcs.filter((n) => n.station && !n.standing)) {
      const a = floorPlan.stations.find((s) => s.number === n.station)!
      const d = Math.hypot(n.position[0] - a.screenPosition[0], n.position[1] - a.screenPosition[2])
      expect(d, n.id).toBeLessThan(1)
    }
  })

  it('les personnages debout ne bloquent l’accès à aucun poste', () => {
    const grid = buildNavGrid({ ...floorPlan, boxes: [...floorPlan.boxes, ...npcObstacles] })
    const [x, , z] = floorPlan.spawn.position
    expect(isFree(grid, ...toCell(grid, [x, z]))).toBe(true)
    for (const a of floorPlan.stations) {
      const path = findPath(grid, [x, z], standPoint(a))
      expect(path, `poste ${a.number}`).not.toBeNull()
      const end = path![path!.length - 1]!
      const d = Math.hypot(end[0] - a.screenPosition[0], end[1] - a.screenPosition[2])
      expect(d, `poste ${a.number}`).toBeLessThanOrEqual(a.interactionRadius ?? 2)
    }
  })
})
