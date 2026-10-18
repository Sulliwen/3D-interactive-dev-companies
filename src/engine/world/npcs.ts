import { floorPlan, type BoxElement, type StationAnchor, type Vec2 } from './floorplan'

/**
 * Où se trouve chaque personnage de l'étage et ce qu'il fait. Les postes sont occupés par
 * leur titulaire (assis à sa chaise, ou debout pour le bureau haut du Scrum Master) ; des
 * figurants animent le café, la salle de réunion et le mur Scrum.
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

interface StationPerson {
  station: number
  id: string
  name: string
  role: string
  clip: Clip
}

const STATION_PEOPLE: StationPerson[] = [
  { station: 1, id: 'lucie', name: 'Lucie Martin', role: 'Support client', clip: 'type' },
  { station: 2, id: 'samir', name: 'Samir Haddad', role: 'Recherche utilisateur', clip: 'type' },
  { station: 3, id: 'julien', name: 'Julien Moreau', role: 'Data', clip: 'type' },
  { station: 4, id: 'claire', name: 'Claire Dubois', role: 'Product Manager', clip: 'think' },
  { station: 5, id: 'mathilde', name: 'Mathilde Nguyen', role: 'Product Owner', clip: 'type' },
  { station: 6, id: 'hugo', name: 'Hugo Lefèvre', role: 'Designer UX/UI', clip: 'type' },
  { station: 7, id: 'fatou', name: 'Fatou Sow', role: 'Scrum Master', clip: 'stand_type' },
  { station: 8, id: 'awa', name: 'Awa Diallo', role: 'Développeuse back-end', clip: 'type' },
  { station: 9, id: 'thomas', name: 'Thomas Petit', role: 'Développeur front-end', clip: 'type' },
  { station: 10, id: 'marc', name: 'Marc Rousseau', role: 'Développeur senior', clip: 'think' },
  { station: 11, id: 'ines', name: 'Inès Garcia', role: 'QA', clip: 'type' },
  { station: 12, id: 'lea', name: 'Léa Kowalski', role: 'Sécurité', clip: 'type' },
  { station: 13, id: 'ibrahima', name: 'Ibrahima Ndiaye', role: 'DevOps / SRE', clip: 'phone' },
  { station: 14, id: 'camille', name: 'Camille Robert', role: 'Supervision', clip: 'type' },
]

function anchor(n: number): StationAnchor {
  const a = floorPlan.stations.find((s) => s.number === n)
  if (!a) throw new Error(`Poste ${n} absent du plan`)
  return a
}

const chairs = floorPlan.boxes.filter((b) => b.name.endsWith('_chair'))

function nearestChair(x: number, z: number): BoxElement {
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

function stationPlacement(p: StationPerson): NpcPlacement {
  const a = anchor(p.station)
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
  const chair = nearestChair(sx + nx * 0.9, sz + nz * 0.9)
  return {
    ...p,
    position: seated([chair.position[0], chair.position[2]], facing),
    rotationY: facing,
    standing: false,
  }
}

function figurants(): NpcPlacement[] {
  const meetingChair = floorPlan.boxes.find((b) => b.name === 'meeting_chair_4')!
  return [
    {
      id: 'nadia',
      name: 'Nadia Benali',
      role: 'Engineering Manager',
      station: 15,
      position: [-13.9, -5.5],
      rotationY: Math.PI / 2 + 0.5,
      clip: 'talk',
      standing: true,
    },
    {
      id: 'elise',
      name: 'Élise',
      role: 'En réunion',
      position: seated([meetingChair.position[0], meetingChair.position[2]], Math.PI),
      rotationY: Math.PI,
      clip: 'sit_talk',
      standing: false,
    },
    {
      id: 'yanis',
      name: 'Yanis',
      role: 'Pause café',
      position: [-12.4, 7.45],
      rotationY: Math.PI + 0.35,
      clip: 'drink',
      standing: true,
    },
    {
      id: 'sophie',
      name: 'Sophie',
      role: 'Pause café',
      position: [-11.3, 7.6],
      rotationY: Math.PI - 0.6,
      clip: 'talk',
      standing: true,
    },
    {
      id: 'paul',
      name: 'Paul',
      role: 'Au mur Scrum',
      position: [0.9, 0.25],
      rotationY: Math.PI,
      clip: 'point',
      standing: true,
    },
  ]
}

export const npcs: NpcPlacement[] = [...STATION_PEOPLE.map(stationPlacement), ...figurants()]

/** Les personnages debout comme obstacles (collisions, itinéraires). */
export const npcObstacles: BoxElement[] = npcs
  .filter((n) => n.standing)
  .map((n) => ({
    name: `col_npc_${n.id}`,
    material: 'fabric',
    position: [n.position[0], 0.9, n.position[1]],
    size: [0.5, 1.8, 0.5],
    collider: true,
  }))
