import { describe, expect, it } from 'vitest'
import { toDb, volumeAt } from './schema'

describe('mélange piloté par un paramètre', () => {
  const curve = [
    [0, 0],
    [0.5, 1],
    [1, 0.5],
  ] as const

  it('interpole le volume entre les points de la courbe', () => {
    expect(volumeAt(curve, 0.25)).toBeCloseTo(0.5)
    expect(volumeAt(curve, 0.75)).toBeCloseTo(0.75)
    expect(volumeAt(curve, 1)).toBe(0.5)
  })

  it('affiche les volumes en décibels', () => {
    expect(toDb(1)).toBe('0 dB')
    expect(toDb(0.5)).toBe('−6 dB')
    expect(toDb(0)).toBe('−∞ dB')
  })
})
