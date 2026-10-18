import type { BoxElement, FloorPlan, StationAnchor, Vec2 } from './floorplan'

/**
 * Où se trouve chaque personnage d'un étage et ce qu'il fait. Les postes sont occupés par
 * leur titulaire (assis à sa chaise, ou debout à un bureau haut) ; des figurants animent
 * les autres lieux. Chaque monde décrit les siens (worlds/<monde>/people.ts).
 *
 * Repère : un personnage regarde vers +Z quand `rotationY` vaut 0 (comme l'avatar).
 */

/** Animations disponibles (art/build/characters/animations.glb). */
export type Clip =
  | 'idle'
  | 'talk'
  | 'walk'
  | 'run'
  | 'sit'
  | 'sit_talk'
  | 'type'
  | 'phone'
  | 'think'
  | 'stand_type'
  | 'drink'
  | 'point'

export interface NpcPlacement {
  /** Identifiant du personnage (tools/blender/characters.json, public/models/characters/<id>.glb). */
  id: string
  name: string
  role: string
  /** Poste occupé, s'il y en a un. */
  station?: number
  position: Vec2
  rotationY: number
  clip: Clip
  /** Debout : bloque le passage (collision, itinéraires). */
  standing: boolean
}

/** Distance entre l'origine d'un personnage assis et son bassin (la pose assise recule le bassin). */
const SEAT_PELVIS_OFFSET = 0.33
/** Distance écran → personnage debout qui tape au bureau haut. */
const STANDING_DESK_DISTANCE = 0.5

export interface StationPerson {
  station: number
  id: string
  name: string
  role: string
  clip: Clip
}

function anchor(plan: FloorPlan, n: number): StationAnchor {
  const a = plan.stations.find((s) => s.number === n)
  if (!a) throw new Error(`Poste ${n} absent du plan`)
  return a
}

function nearestChair(plan: FloorPlan, x: number, z: number): BoxElement {
  const chairs = plan.boxes.filter((b) => b.name.endsWith('_chair'))
  let best = chairs[0]!
  for (const c of chairs) {
    if (
      Math.hypot(c.position[0] - x, c.position[2] - z) <
      Math.hypot(best.position[0] - x, best.position[2] - z)
    )
      best = c
  }
  return best
}

/** Assis à une chaise, tourné vers un point : le bassin au-dessus de l'assise. */
function seated(chair: Vec2, facing: number): Vec2 {
  return [
    chair[0] + Math.sin(facing) * SEAT_PELVIS_OFFSET,
    chair[1] + Math.cos(facing) * SEAT_PELVIS_OFFSET,
  ]
}

/** Le titulaire d'un poste, à son bureau. */
export function stationPlacement(plan: FloorPlan, p: StationPerson): NpcPlacement {
  const a = anchor(plan, p.station)
  const [sx, , sz] = a.screenPosition
  const nx = Math.sin(a.screenRotationY)
  const nz = Math.cos(a.screenRotationY)
  // Regarder l'écran : le dos à la direction vers laquelle l'écran fait face.
  const facing = a.screenRotationY + Math.PI
  if (p.clip === 'stand_type') {
    return {
      ...p,
      position: [sx + nx * STANDING_DESK_DISTANCE, sz + nz * STANDING_DESK_DISTANCE],
      rotationY: facing,
      standing: true,
    }
  }
  const chair = nearestChair(plan, sx + nx * 0.9, sz + nz * 0.9)
  return {
    ...p,
    position: seated([chair.position[0], chair.position[2]], facing),
    rotationY: facing,
    standing: false,
  }
}

/** Assis à une chaise du plan (par son nom), tourné vers `facing`. */
export function seatedAt(plan: FloorPlan, chairName: string, facing: number): Vec2 {
  const chair = plan.boxes.find((b) => b.name === chairName)
  if (!chair) throw new Error(`Chaise « ${chairName} » absente du plan`)
  return seated([chair.position[0], chair.position[2]], facing)
}

/** Les personnages debout comme obstacles (collisions, itinéraires). */
export function obstaclesOf(people: readonly NpcPlacement[]): BoxElement[] {
  return people
    .filter((n) => n.standing)
    .map((n) => ({
      name: `col_npc_${n.id}`,
      material: 'fabric',
      position: [n.position[0], 0.9, n.position[1]],
      size: [0.5, 1.8, 0.5],
      collider: true,
    }))
}
