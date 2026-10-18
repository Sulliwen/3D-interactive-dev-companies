import { describe, expect, it } from 'vitest'
import type { StationAnchor } from '../world/floorplan'
import { findNearbyStation } from './proximity'

const anchor = (number: number, x: number, z: number, rotationY: number): StationAnchor => ({
  number,
  screenPosition: [x, 1, z],
  screenRotationY: rotationY,
  screenSize: [0.6, 0.35],
})

describe('poste à portée', () => {
  // Écran en (0, 0) dont la face regarde vers +Z.
  const screens = [anchor(1, 0, 0, 0), anchor(2, 1.6, 0, 0)]

  it('trouve l’écran le plus proche devant le visiteur', () => {
    expect(findNearbyStation([0.2, 1.2], screens)).toBe(1)
    expect(findNearbyStation([1.4, 1.2], screens)).toBe(2)
  })

  it('ignore les écrans trop loin', () => {
    expect(findNearbyStation([0, 3], screens)).toBeNull()
  })

  it('ignore un écran vu de dos', () => {
    expect(findNearbyStation([0, -1], screens)).toBeNull()
  })
})
