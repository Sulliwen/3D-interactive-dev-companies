/**
 * Plan d'un étage : types et briques communes (murs, îlots de bureaux).
 *
 * Chaque monde a son plan (src/engine/world/worlds/<monde>/plan.ts). C'est la source
 * unique de sa géométrie : le rendu en boîtes, les collisions, les itinéraires, les
 * ancres des postes et la scène Blender (`npm run art:build`) en sont dérivés.
 *
 * Repère : 1 unité = 1 m. Origine au centre de l'étage, Y vers le haut.
 * Le nord (baies vitrées principales) est vers -Z, l'entrée au sud (+Z).
 * Une rotation `rotationY` de 0 oriente la face avant d'un objet vers +Z.
 */

export type Vec2 = readonly [x: number, z: number]
export type Vec3 = readonly [x: number, y: number, z: number]

export type MaterialKey =
  | 'wall'
  | 'glass'
  | 'wood'
  | 'darkMetal'
  | 'white'
  | 'fabric'
  | 'sofa'
  | 'screen'
  | 'accent'
  | 'plant'
  | 'board'
  | 'postit'

export type FloorKey = 'concrete' | 'carpet' | 'carpetTeam' | 'woodFloor' | 'rug'

export interface BoxElement {
  name: string
  material: MaterialKey
  /** Centre de la boîte. */
  position: Vec3
  size: Vec3
  rotationY?: number
  /** Couleur propre à cette boîte (sinon celle du matériau). */
  color?: string
  /** La boîte bloque-t-elle le visiteur ? */
  collider: boolean
}

export interface Zone {
  id: string
  label: string
  min: Vec2
  max: Vec2
  floor: FloorKey
}

export interface StationAnchor {
  /** Numéro du poste de l'étage, relié au métier qui l'occupe (`desk` des fichiers roles/). */
  number: number
  /** Centre de l'écran du poste. */
  screenPosition: Vec3
  /** Orientation de la face avant de l'écran. */
  screenRotationY: number
  screenSize: readonly [width: number, height: number]
  /** Distance d'interaction propre au poste (grand écran mural…). */
  interactionRadius?: number
}

export interface FloorPlan {
  width: number
  depth: number
  wallHeight: number
  spawn: { position: Vec3; rotationY: number }
  zones: Zone[]
  boxes: BoxElement[]
  stations: StationAnchor[]
}

/** Hauteur sous plafond et épaisseur des murs par défaut, en mètres. */
export const WALL_HEIGHT = 3
export const WALL_THICKNESS = 0.2

/** Rotation d'un point (x, z) autour de l'axe Y, même convention que three.js. */
export function rotateY([x, z]: Vec2, angle: number): Vec2 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return [x * c + z * s, -x * s + z * c]
}

/** Petit bruit déterministe pour désaligner chaises et objets sans hasard. */
export function jitter(seed: number, amplitude: number): number {
  const v = Math.sin(seed * 12.9898) * 43758.5453
  return (v - Math.floor(v) - 0.5) * 2 * amplitude
}

/** Mur horizontal (le long de X) ou vertical (le long de Z), percé d'ouvertures. */
export function wallRun(
  name: string,
  axis: 'x' | 'z',
  fixed: number,
  from: number,
  to: number,
  material: MaterialKey,
  openings: ReadonlyArray<readonly [number, number]> = [],
  height = WALL_HEIGHT,
): BoxElement[] {
  const segments: Array<[number, number]> = []
  let cursor = from
  for (const [a, b] of [...openings].sort((p, q) => p[0] - q[0])) {
    if (a > cursor) segments.push([cursor, a])
    cursor = Math.max(cursor, b)
  }
  if (cursor < to) segments.push([cursor, to])

  return segments.map(([a, b], i) => {
    const length = b - a
    const mid = (a + b) / 2
    return {
      name: `${name}_${i}`,
      material,
      position: axis === 'x' ? [mid, height / 2, fixed] : [fixed, height / 2, mid],
      size: axis === 'x' ? [length, height, WALL_THICKNESS] : [WALL_THICKNESS, height, length],
      collider: true,
    }
  })
}

const DESK_W = 1.6
const DESK_D = 0.8
const DESK_H = 0.75

/**
 * Îlot de 4 bureaux disposés dos à dos (2 rangées de 2).
 * `seats` associe chaque place à un numéro de poste (ou `null` pour une place libre),
 * dans l'ordre : rangée nord gauche, rangée nord droite, rangée sud gauche, rangée sud droite
 * (pour un îlot non tourné).
 */
export function deskIsland(
  name: string,
  center: Vec2,
  rotation: number,
  seats: readonly [number | null, number | null, number | null, number | null],
): { boxes: BoxElement[]; stations: StationAnchor[] } {
  const boxes: BoxElement[] = []
  const stations: StationAnchor[] = []
  const toWorld = (local: Vec2): Vec2 => {
    const [x, z] = rotateY(local, rotation)
    return [center[0] + x, center[1] + z]
  }

  // Cloison acoustique centrale.
  const [px, pz] = toWorld([0, 0])
  boxes.push({
    name: `${name}_partition`,
    material: 'fabric',
    position: [px, DESK_H + 0.2, pz],
    size: [DESK_W * 2, 0.4, 0.04],
    rotationY: rotation,
    collider: false,
  })

  seats.forEach((station, i) => {
    const side = i < 2 ? -1 : 1 // -1 : rangée nord (locale), +1 : rangée sud
    const lx = i % 2 === 0 ? -DESK_W / 2 : DESK_W / 2
    // La face avant de l'écran regarde la place assise, donc vers l'extérieur de l'îlot.
    const facing = rotation + (side < 0 ? Math.PI : 0)
    const id = `${name}_${i}`

    const [dx, dz] = toWorld([lx, (side * DESK_D) / 2])
    boxes.push({
      name: `${id}_desk`,
      material: 'wood',
      position: [dx, DESK_H / 2, dz],
      size: [DESK_W - 0.04, DESK_H, DESK_D],
      rotationY: rotation,
      collider: true,
    })

    const [mx, mz] = toWorld([lx, side * 0.22])
    const screenSize = [0.62, 0.36] as const
    const screenY = DESK_H + 0.12 + screenSize[1] / 2
    boxes.push({
      name: `${id}_monitor`,
      material: 'screen',
      position: [mx, screenY, mz],
      size: [screenSize[0], screenSize[1], 0.03],
      rotationY: rotation,
      collider: false,
    })

    const [cx, cz] = toWorld([lx + jitter(i + center[0], 0.12), side * (DESK_D + 0.35)])
    boxes.push({
      name: `${id}_chair`,
      material: 'darkMetal',
      position: [cx, 0.45, cz],
      size: [0.5, 0.9, 0.5],
      rotationY: rotation + jitter(i * 7 + center[1], 0.35),
      collider: true,
    })

    if (station !== null) {
      // L'écran affiché est légèrement devant le boîtier du moniteur.
      const [sx, sz] = toWorld([lx, side * 0.22 + side * 0.016])
      stations.push({
        number: station,
        screenPosition: [sx, screenY, sz],
        screenRotationY: facing,
        screenSize,
      })
    }
  })

  return { boxes, stations }
}
