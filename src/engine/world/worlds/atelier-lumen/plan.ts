import {
  WALL_HEIGHT as WALL_H,
  WALL_THICKNESS as WALL_T,
  deskIsland,
  jitter,
  wallRun,
  type BoxElement,
  type FloorPlan,
  type StationAnchor,
  type Vec2,
  type Zone,
} from '../../floorplan'

/**
 * Plan de l'étage d'Atelier Lumen : un plateau ouvert de 30 × 20 m au 9e étage, baies
 * vitrées au nord et à l'est, entrée au sud.
 */

const WIDTH = 30
const DEPTH = 20
const HALF_W = WIDTH / 2
const HALF_D = DEPTH / 2

function buildFloorPlan(): FloorPlan {
  const boxes: BoxElement[] = []
  const stations: StationAnchor[] = []
  const add = (...items: BoxElement[]) => boxes.push(...items)

  // --- Enveloppe du bâtiment -------------------------------------------------
  add(
    ...wallRun('col_wall_north_glass', 'x', -HALF_D, -HALF_W, HALF_W, 'glass'),
    ...wallRun('col_wall_east_glass', 'z', HALF_W, -HALF_D, HALF_D, 'glass'),
    ...wallRun('col_wall_west', 'z', -HALF_W, -HALF_D, HALF_D, 'wall'),
    ...wallRun('col_wall_south', 'x', HALF_D, -HALF_W, HALF_W, 'wall', [[-1.5, 1.5]]),
    // Portes vitrées de l'entrée (fermées : on visite l'étage, pas la rue).
    ...wallRun('col_door_entrance', 'x', HALF_D, -1.5, 1.5, 'glass', [], 2.4),
  )
  // Linteau au-dessus de la porte (sans lui, la caméra passerait par-dessus).
  add({
    name: 'col_door_lintel',
    material: 'wall',
    position: [0, (2.4 + WALL_H) / 2, HALF_D],
    size: [3, WALL_H - 2.4, WALL_T],
    collider: true,
  })
  // Poteaux de structure.
  for (const [i, [x, z]] of (
    [
      [-7, 1.5],
      [7, 1.5],
    ] as const
  ).entries()) {
    add({
      name: `col_pillar_${i}`,
      material: 'wall',
      position: [x, WALL_H / 2, z],
      size: [0.4, WALL_H, 0.4],
      collider: true,
    })
  }

  // --- Salle de réunion vitrée (nord-ouest) ----------------------------------
  add(
    ...wallRun('col_meeting_glass_south', 'x', -4.5, -HALF_W, -7, 'glass', [[-9.6, -8.4]]),
    ...wallRun('col_meeting_glass_east', 'z', -7, -HALF_D, -4.5, 'glass'),
    {
      name: 'meeting_table',
      material: 'wood',
      position: [-11, 0.375, -7.25],
      size: [3.6, 0.75, 1.2],
      collider: true,
    },
    {
      name: 'meeting_screen',
      material: 'screen',
      position: [-14.87, 1.5, -7.25],
      size: [1.76, 1.04, 0.04],
      rotationY: Math.PI / 2,
      collider: false,
    },
    {
      name: 'meeting_paperboard',
      material: 'white',
      position: [-8, 0.95, -9.2],
      size: [0.8, 1.9, 0.1],
      rotationY: -0.4,
      collider: true,
    },
  )
  for (let i = 0; i < 6; i++) {
    const x = -12.2 + (i % 3) * 1.2
    const z = i < 3 ? -8.3 : -6.2
    add({
      name: `meeting_chair_${i}`,
      material: 'darkMetal',
      position: [x + jitter(i, 0.1), 0.45, z],
      size: [0.5, 0.9, 0.5],
      rotationY: jitter(i + 3, 0.3),
      collider: true,
    })
  }

  // --- Cabines téléphoniques (ouest) -----------------------------------------
  for (const [i, z] of [-3, -1.5].entries()) {
    add({
      name: `col_phone_booth_${i}`,
      material: 'sofa',
      position: [-14.3, 1.1, z],
      size: [1.2, 2.2, 1.3],
      collider: true,
    })
  }

  // --- Coin café et cuisine (sud-ouest) --------------------------------------
  add(
    {
      name: 'kitchen_counter',
      material: 'white',
      position: [-14.55, 0.45, 6.5],
      size: [0.7, 0.9, 5],
      collider: true,
    },
    {
      name: 'kitchen_fridge',
      material: 'darkMetal',
      position: [-14.55, 0.95, 3.4],
      size: [0.7, 1.9, 0.7],
      collider: true,
    },
    {
      name: 'coffee_machine',
      material: 'darkMetal',
      position: [-14.6, 1.1, 5],
      size: [0.4, 0.4, 0.4],
      collider: false,
    },
    {
      name: 'cafe_bar_table',
      material: 'wood',
      position: [-11.5, 0.525, 6.2],
      size: [2.4, 1.05, 0.9],
      collider: true,
    },
    {
      name: 'cafe_sofa',
      material: 'sofa',
      position: [-9.5, 0.4, 9.2],
      size: [2.2, 0.8, 0.9],
      collider: true,
    },
    {
      name: 'cafe_low_table',
      material: 'wood',
      position: [-9.5, 0.2, 8],
      size: [1.2, 0.4, 0.6],
      collider: true,
    },
  )

  // --- Accueil (sud, point de départ) ----------------------------------------
  add(
    {
      name: 'reception_desk',
      material: 'wood',
      position: [4.5, 0.55, 7.8],
      size: [2.8, 1.1, 0.8],
      collider: true,
    },
    {
      name: 'reception_logo',
      material: 'accent',
      position: [4.5, 1.9, HALF_D - 0.13],
      size: [3, 0.7, 0.05],
      collider: false,
    },
    {
      name: 'welcome_screen',
      material: 'screen',
      position: [-3.5, 1.6, HALF_D - 0.13],
      size: [1.4, 0.8, 0.05],
      collider: false,
    },
  )

  // --- Casiers, imprimante, coin détente (sud-est) ---------------------------
  add(
    {
      name: 'lockers',
      material: 'darkMetal',
      position: [13.3, 1, HALF_D - 0.4],
      size: [3, 2, 0.5],
      collider: true,
    },
    {
      name: 'printer',
      material: 'white',
      position: [10.4, 0.5, HALF_D - 0.45],
      size: [0.7, 1, 0.6],
      collider: true,
    },
    {
      name: 'lounge_sofa',
      material: 'sofa',
      position: [14.35, 0.4, 4.5],
      size: [0.9, 0.8, 2.2],
      collider: true,
    },
    {
      name: 'evacuation_plan',
      material: 'white',
      position: [8.5, 1.5, HALF_D - 0.13],
      size: [0.5, 0.7, 0.03],
      collider: false,
    },
  )

  // --- Mur Scrum et coin du daily (centre) -----------------------------------
  add({
    name: 'scrum_board',
    material: 'board',
    position: [0, 1.15, -0.5],
    size: [4.4, 1.7, 0.1],
    collider: true,
  })
  const columns = 4
  for (let c = 0; c < columns; c++) {
    const cards = [5, 3, 2, 4][c] ?? 0
    for (let k = 0; k < cards; k++) {
      const x = -1.65 + c * 1.1 + jitter(c * 10 + k, 0.18)
      const y = 1.7 - k * 0.24
      const colors = ['#f7d154', '#7fc8f8', '#f4978e', '#a8e6a3']
      add({
        name: `scrum_postit_${c}_${k}`,
        material: 'postit',
        position: [x, y, -0.44],
        size: [0.14, 0.14, 0.01],
        color: colors[(c + k) % colors.length],
        collider: false,
      })
    }
  }
  // Poste du Scrum Master : bureau debout à côté du mur Scrum.
  add({
    name: 'scrum_master_desk',
    material: 'wood',
    position: [3.6, 0.525, -0.3],
    size: [1.4, 1.05, 0.7],
    collider: true,
  })
  add({
    name: 'scrum_master_monitor',
    material: 'screen',
    position: [3.6, 1.32, -0.45],
    size: [0.62, 0.36, 0.03],
    collider: false,
  })
  // Poste bonus de l'Engineering Manager : l'écran mural de la salle de réunion.
  stations.push({
    number: 15,
    screenPosition: [-14.84, 1.5, -7.25],
    screenRotationY: Math.PI / 2,
    screenSize: [1.72, 1.0],
    interactionRadius: 3,
  })
  stations.push({
    number: 7,
    screenPosition: [3.6, 1.32, -0.43],
    screenRotationY: 0,
    screenSize: [0.62, 0.36],
  })

  // --- Îlots de postes -------------------------------------------------------
  const islands = [
    deskIsland('island_product', [-3, -6.5], 0, [2, 4, 5, 6]),
    deskIsland('island_dev', [3.5, -6.5], 0, [8, 9, 10, null]),
    deskIsland('island_ops', [11, -1], Math.PI / 2, [11, 12, 13, 14]),
    deskIsland('island_support', [-4, 6.5], 0, [1, 3, null, null]),
  ]
  for (const island of islands) {
    boxes.push(...island.boxes)
    stations.push(...island.stations)
  }

  // --- Plantes ---------------------------------------------------------------
  const plants: Vec2[] = [
    [-6.4, -9.4],
    [7.6, -9.4],
    [14.3, -9.4],
    [-6.4, 2.6],
    [7.6, 3.2],
    [14.3, 7],
    [-7.6, 9.4],
  ]
  plants.forEach(([x, z], i) =>
    add({
      name: `plant_${i}`,
      material: 'plant',
      position: [x, 0.6, z],
      size: [0.55, 1.2, 0.55],
      collider: true,
    }),
  )

  const zones: Zone[] = [
    {
      id: 'meeting',
      label: 'Salle de réunion',
      min: [-HALF_W, -HALF_D],
      max: [-7, -4.5],
      floor: 'carpet',
    },
    {
      id: 'product',
      label: 'Îlot Produit et Design',
      min: [-5.8, -9],
      max: [-0.2, -4],
      floor: 'carpetTeam',
    },
    { id: 'dev', label: 'Îlot Dev', min: [0.7, -9], max: [6.3, -4], floor: 'carpetTeam' },
    {
      id: 'ops',
      label: 'Îlot QA, Sécurité et DevOps',
      min: [8.5, -3.8],
      max: [13.5, 1.8],
      floor: 'carpetTeam',
    },
    { id: 'daily', label: 'Coin du daily', min: [-2.2, 0.8], max: [2.2, 3.6], floor: 'rug' },
    {
      id: 'cafe',
      label: 'Café et cuisine',
      min: [-HALF_W, 2.5],
      max: [-8, HALF_D],
      floor: 'woodFloor',
    },
    {
      id: 'support',
      label: 'Support et Data',
      min: [-6.8, 4],
      max: [-1.2, 9],
      floor: 'carpetTeam',
    },
    { id: 'reception', label: 'Accueil', min: [-1.2, 6.5], max: [7.5, HALF_D], floor: 'woodFloor' },
  ]

  return {
    width: WIDTH,
    depth: DEPTH,
    wallHeight: WALL_H,
    spawn: { position: [0, 0, 6.4], rotationY: Math.PI },
    zones,
    boxes,
    stations: stations.sort((a, b) => a.number - b.number),
  }
}

export const plan: FloorPlan = buildFloorPlan()
