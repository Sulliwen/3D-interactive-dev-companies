import { describe, expect, it } from 'vitest'
import { MAX_ANIMATED, planCharacters } from './manager'

describe('gestion des personnages', () => {
  it('ne dessine ni n’anime ce qui est hors champ ou masqué', () => {
    const [a, b] = planCharacters([
      { distance: 3, inView: false, hidden: false },
      { distance: 3, inView: true, hidden: true },
    ])
    expect(a).toEqual({ visible: false, lod: 1, step: null })
    expect(b!.visible).toBe(false)
  })

  it('version détaillée et animation fluide de près, allégée et ralentie au loin', () => {
    const [near, far] = planCharacters([
      { distance: 4, inView: true, hidden: false },
      { distance: 15, inView: true, hidden: false },
    ])
    expect(near).toEqual({ visible: true, lod: 0, step: 0 })
    expect(far).toEqual({ visible: true, lod: 1, step: 0.1 })
  })

  it(`n’anime que les ${MAX_ANIMATED} plus proches`, () => {
    const items = Array.from({ length: MAX_ANIMATED + 3 }, (_, i) => ({
      distance: i + 1,
      inView: true,
      hidden: false,
    }))
    const plans = planCharacters(items)
    expect(plans.filter((p) => p.step !== null)).toHaveLength(MAX_ANIMATED)
    expect(plans.at(-1)!.step).toBeNull()
    expect(plans.at(-1)!.visible).toBe(true)
  })
})
