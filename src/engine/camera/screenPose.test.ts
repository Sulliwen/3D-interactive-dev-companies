import { describe, expect, it } from 'vitest'
import type { StationAnchor } from '../world/floorplan'
import { computeScreenPose } from './screenPose'

// Écran de 0,62 × 0,36 m en (0, 1, 0), face vers +Z.
const anchor: StationAnchor = {
  number: 8,
  screenPosition: [0, 1, 0],
  screenRotationY: 0,
  screenSize: [0.62, 0.36],
}

const project = (x: number, z: number, fovDeg: number, aspect: number) => {
  // Coordonnée horizontale normalisée (-1 à 1) d'un point vu par une caméra regardant -Z depuis (x, z).
  const tan = Math.tan((fovDeg * Math.PI) / 360)
  return (0 - x) / (z * tan * aspect)
}

describe('cadrage de la caméra face à un écran', () => {
  it('se place devant l’écran, regard dans l’axe, à hauteur de l’écran', () => {
    const pose = computeScreenPose(anchor, { fovDeg: 55, aspect: 16 / 9, availableFraction: 1 })
    expect(pose.position[0]).toBeCloseTo(0)
    expect(pose.position[1]).toBeCloseTo(1)
    expect(pose.position[2]).toBeGreaterThan(0.3)
    expect(pose.direction).toEqual([-0, 0, -1])
  })

  it('l’écran tient en hauteur (80 % de la fenêtre au plus)', () => {
    const pose = computeScreenPose(anchor, { fovDeg: 55, aspect: 16 / 9, availableFraction: 1 })
    const visibleHeight = 2 * pose.position[2] * Math.tan((55 * Math.PI) / 360)
    expect(0.36 / visibleHeight).toBeLessThanOrEqual(0.8 + 1e-9)
  })

  it('centre l’écran dans la partie laissée libre par la fiche', () => {
    const fit = { fovDeg: 55, aspect: 16 / 9, availableFraction: 0.65 }
    const pose = computeScreenPose(anchor, fit)
    const ndcX = project(pose.position[0], pose.position[2], fit.fovDeg, fit.aspect)
    // Centre de la zone libre : de -1 à -1 + 2 × 0,65.
    expect(ndcX).toBeCloseTo(-1 + 0.65)
  })

  it('suit l’orientation de l’écran', () => {
    const pose = computeScreenPose(
      { ...anchor, screenRotationY: Math.PI / 2 },
      { fovDeg: 55, aspect: 1.5, availableFraction: 1 },
    )
    expect(pose.position[0]).toBeGreaterThan(0.3)
    expect(pose.direction[0]).toBeCloseTo(-1)
  })
})
