import { describe, expect, it } from 'vitest'
import { getVisit } from '../../content/loader'
import { worldOf } from './worlds'
import { npcObstaclesFor, npcsFor, stagedVisits } from './staging'
import { buildNavGrid, findPath, isFree, toCell } from '../nav/navGrid'
import { standPoint } from '../stations/standPoint'

for (const key of ['atelier-lumen/retours-utilisateurs', ...stagedVisits()]) {
  const npcs = npcsFor(key)
  const npcObstacles = npcObstaclesFor(key)
  const [structure = '', scenario = ''] = key.split('/')
  const floorPlan = worldOf(structure).plan

  describe(`personnages · ${key}`, () => {
    it('chaque poste occupé a son titulaire, les bureaux vides n’en ont pas', () => {
      const stations = new Set(npcs.map((n) => n.station).filter(Boolean))
      for (const s of getVisit({ structure, scenario }).stations) {
        expect(stations.has(s.desk), `poste ${s.desk}`).toBe(!s.absent)
      }
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
        const d = Math.hypot(
          n.position[0] - a.screenPosition[0],
          n.position[1] - a.screenPosition[2],
        )
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
}
