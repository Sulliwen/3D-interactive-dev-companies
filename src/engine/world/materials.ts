import type { FloorKey, MaterialKey } from './floorplan'

export interface MaterialSpec {
  color: string
  roughness: number
  metalness?: number
  opacity?: number
  emissive?: string
  castShadow?: boolean
}

/** Teintes du blockout : lisibles, proches des futurs matériaux (bois clair, béton, métal noir…). */
export const MATERIALS: Record<MaterialKey, MaterialSpec> = {
  wall: { color: '#e9e5de', roughness: 0.9 },
  glass: { color: '#a9c7d6', roughness: 0.05, opacity: 0.18, castShadow: false },
  wood: { color: '#c9a77c', roughness: 0.6 },
  darkMetal: { color: '#2f3237', roughness: 0.5, metalness: 0.3 },
  white: { color: '#f4f4f2', roughness: 0.5 },
  fabric: { color: '#7d8c84', roughness: 1 },
  sofa: { color: '#5b6b7f', roughness: 1 },
  screen: { color: '#1b1f27', roughness: 0.25, emissive: '#2a3a55' },
  accent: { color: '#f2a541', roughness: 0.4, emissive: '#5a3500' },
  plant: { color: '#4f7d4a', roughness: 0.9 },
  board: { color: '#fbfbf8', roughness: 0.7 },
  postit: { color: '#f7d154', roughness: 0.9, castShadow: false },
}

export const FLOORS: Record<FloorKey, string> = {
  concrete: '#b8b4ad',
  carpet: '#6d7a8a',
  carpetTeam: '#8b9690',
  woodFloor: '#cdb08a',
  rug: '#d98f6a',
}
