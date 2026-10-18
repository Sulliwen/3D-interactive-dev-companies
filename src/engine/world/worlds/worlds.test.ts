import { describe, expect, it } from 'vitest'
import { obstaclesOf } from '../npcs'
import { buildNavGrid, findPath, isFree, toCell } from '../../nav/navGrid'
import { standPoint } from '../../stations/standPoint'
import { WORLDS } from '.'

for (const world of Object.values(WORLDS)) {
  const { plan } = world
  const people = [...world.stationNpcs, ...world.figurants]

  describe(`monde ${world.id}`, () => {
    it('postes numérotés de 1 à n, sans doublon', () => {
      expect(plan.stations.map((s) => s.number)).toEqual(plan.stations.map((_, i) => i + 1))
    })

    it('noms d’éléments uniques', () => {
      const names = plan.boxes.map((b) => b.name)
      expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([])
    })

    it('chaque poste a son titulaire, et chacun est dans l’étage', () => {
      const occupied = new Set(people.map((p) => p.station).filter(Boolean))
      for (const s of plan.stations) expect(occupied.has(s.number), `poste ${s.number}`).toBe(true)
      for (const p of people) {
        expect(Math.abs(p.position[0]), p.id).toBeLessThan(plan.width / 2 - 0.2)
        expect(Math.abs(p.position[1]), p.id).toBeLessThan(plan.depth / 2 - 0.2)
      }
    })

    it('depuis l’entrée, on atteint chaque poste (personnages debout compris)', () => {
      const grid = buildNavGrid({ ...plan, boxes: [...plan.boxes, ...obstaclesOf(people)] })
      const [x, , z] = plan.spawn.position
      expect(isFree(grid, ...toCell(grid, [x, z]))).toBe(true)
      for (const a of plan.stations) {
        const path = findPath(grid, [x, z], standPoint(a))
        expect(path, `poste ${a.number}`).not.toBeNull()
        const end = path![path!.length - 1]!
        const d = Math.hypot(end[0] - a.screenPosition[0], end[1] - a.screenPosition[2])
        expect(d, `poste ${a.number}`).toBeLessThanOrEqual(a.interactionRadius ?? 2)
      }
    })
  })
}
