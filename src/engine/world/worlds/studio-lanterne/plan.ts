import {
  WALL_THICKNESS as WALL_T,
  deskIsland,
  jitter,
  singleDesk,
  wallRun,
  type BoxElement,
  type FloorPlan,
  type StationAnchor,
  type Vec2,
  type Zone,
} from '../../floorplan'

/**
 * Plan de l'étage du Studio Lanterne : un ancien chai des Chartrons, à Bordeaux, réhabilité
 * en studio. 30 × 20 m en rez-de-chaussée, murs de briques, grandes fenêtres d'atelier au
 * nord et à l'est, 4 m sous plafond. Entrée au sud.
 */

const WIDTH = 30
const DEPTH = 20
const WALL_H = 4
const HALF_W = WIDTH / 2
const HALF_D = DEPTH / 2

/** Fenêtres d'atelier : allège en briques, vitrage, linteau (de 0,9 m à 3,4 m). */
const SILL = 0.9
const LINTEL = 3.4

/** Mur de briques percé de fenêtres (ouvertures comblées par du vitrage). */
function windowedWall(
  name: string,
  axis: 'x' | 'z',
  fixed: number,
  from: number,
  to: number,
  windows: ReadonlyArray<readonly [number, number]>,
): BoxElement[] {
  const boxes = wallRun(`col_wall_${name}`, axis, fixed, from, to, 'brick', windows, WALL_H)
  windows.forEach(([a, b], i) => {
    const mid = (a + b) / 2
    const len = b - a
    const at = (y: number): [number, number, number] =>
      axis === 'x' ? [mid, y, fixed] : [fixed, y, mid]
    const size = (h: number): [number, number, number] =>
      axis === 'x' ? [len, h, WALL_T] : [WALL_T, h, len]
    boxes.push(
      {
        name: `col_wall_${name}_sill_${i}`,
        material: 'brick',
        position: at(SILL / 2),
        size: size(SILL),
        collider: true,
      },
      {
        name: `col_window_${name}_${i}`,
        material: 'glass',
        position: at((SILL + LINTEL) / 2),
        size: size(LINTEL - SILL),
        collider: true,
      },
      {
        name: `col_wall_${name}_lintel_${i}`,
        material: 'brick',
        position: at((LINTEL + WALL_H) / 2),
        size: size(WALL_H - LINTEL),
        collider: true,
      },
    )
  })
  return boxes
}

function buildFloorPlan(): FloorPlan {
  const boxes: BoxElement[] = []
  const stations: StationAnchor[] = []
  const add = (...items: BoxElement[]) => boxes.push(...items)
  const addAll = (group: { boxes: BoxElement[]; stations: StationAnchor[] }) => {
    boxes.push(...group.boxes)
    stations.push(...group.stations)
  }

  // --- Enveloppe : briques, fenêtres d'atelier, portes vitrées --------------------------
  add(
    ...windowedWall('north', 'x', -HALF_D, -HALF_W, HALF_W, [
      [-7.6, -5.4],
      [-2.6, -0.4],
      [2.4, 4.6],
      [5.8, 8],
    ]),
    ...windowedWall('east', 'z', HALF_W, -HALF_D, HALF_D, [
      [-3, -0.8],
      [0.8, 3],
    ]),
    ...wallRun('col_wall_west', 'z', -HALF_W, -HALF_D, HALF_D, 'brick', [], WALL_H),
    ...wallRun('col_wall_south', 'x', HALF_D, -HALF_W, HALF_W, 'brick', [[-1.5, 1.5]], WALL_H),
    // Grande porte vitrée de l'ancien chai (fermée : on visite le studio, pas la rue).
    ...wallRun('col_door_entrance', 'x', HALF_D, -1.5, 1.5, 'glass', [], 2.8),
  )
  add({
    name: 'col_door_lintel',
    material: 'brick',
    position: [0, (2.8 + WALL_H) / 2, HALF_D],
    size: [3, WALL_H - 2.8, WALL_T],
    collider: true,
  })
  // Colonnes en fonte de l'ancien chai.
  for (const [i, [x, z]] of (
    [
      [-7, 1.2],
      [7, 1.2],
    ] as const
  ).entries()) {
    add({
      name: `col_pillar_${i}`,
      material: 'darkMetal',
      position: [x, WALL_H / 2, z],
      size: [0.3, WALL_H, 0.3],
      collider: true,
    })
  }

  // --- Salle de playtest (nord-ouest) : miroir sans tain côté est -----------------------
  add(
    ...wallRun('col_playtest_wall_south', 'x', -4.5, -HALF_W, -9, 'wall', [[-11.6, -10.6]], WALL_H),
    ...wallRun('col_playtest_mirror', 'z', -9, -HALF_D, -4.5, 'glass', [], WALL_H),
    {
      name: 'playtest_tv',
      material: 'screen',
      position: [-14.86, 1.45, -7.4],
      size: [1.6, 0.92, 0.05],
      rotationY: Math.PI / 2,
      collider: false,
    },
    {
      name: 'playtest_tv_stand',
      material: 'darkMetal',
      position: [-14.6, 0.3, -7.4],
      size: [0.45, 0.6, 2],
      collider: true,
    },
    {
      name: 'playtest_sofa',
      material: 'sofa',
      position: [-11.9, 0.4, -7.4],
      size: [0.9, 0.8, 2.3],
      collider: true,
    },
    {
      name: 'playtest_camera',
      material: 'darkMetal',
      position: [-13.9, 0.8, -9.3],
      size: [0.35, 1.6, 0.35],
      collider: true,
    },
  )
  // La chercheuse playtest observe les joueurs depuis son bureau, contre le mur nord.
  addAll(singleDesk('playtest_research', [-10.4, -9.35], 0, 14))

  // --- Cabine son (ouest) : murs pleins, porte côté est ---------------------------------
  add(
    ...wallRun('col_booth_north', 'x', -3.4, -HALF_W, -11, 'wall', [], 2.8),
    ...wallRun('col_booth_south', 'x', 0.6, -HALF_W, -11, 'wall', [], 2.8),
    ...wallRun('col_booth_east', 'z', -11, -3.4, 0.6, 'wall', [[-0.9, 0.1]], 2.8),
    {
      name: 'booth_ceiling',
      material: 'fabric',
      position: [-13, 2.85, -1.4],
      size: [4, 0.1, 4],
      collider: false,
    },
    {
      name: 'booth_speaker_0',
      material: 'darkMetal',
      position: [-14.65, 1.25, -2.4],
      size: [0.3, 0.45, 0.28],
      collider: false,
    },
    {
      name: 'booth_speaker_1',
      material: 'darkMetal',
      position: [-14.65, 1.25, -0.6],
      size: [0.3, 0.45, 0.28],
      collider: false,
    },
  )
  addAll(singleDesk('sound', [-14.2, -1.5], Math.PI / 2, 11))

  // --- War room (nord-est) : salle vitrée, tableau des jalons ---------------------------
  add(
    ...wallRun('col_warroom_glass_south', 'x', -4.5, 9, HALF_W, 'glass', [[9.6, 10.6]], WALL_H),
    ...wallRun('col_warroom_glass_west', 'z', 9, -HALF_D, -4.5, 'glass', [], WALL_H),
    {
      name: 'warroom_table',
      material: 'wood',
      position: [12.4, 0.375, -6.6],
      size: [3.4, 0.75, 1.2],
      collider: true,
    },
    {
      name: 'milestone_board',
      material: 'board',
      position: [11.6, 1.6, -9.85],
      size: [3.6, 1.6, 0.06],
      collider: false,
    },
  )
  // Une seule rangée de chaises, tournée vers le tableau : on y fait le point sur les jalons.
  for (let i = 0; i < 4; i++) {
    add({
      name: `warroom_chair_${i}`,
      material: 'darkMetal',
      position: [11.1 + i * 1.05 + jitter(i + 20, 0.1), 0.45, -5.5],
      size: [0.5, 0.9, 0.5],
      rotationY: Math.PI + jitter(i + 23, 0.3),
      collider: true,
    })
  }
  // Poste bonus de la relation éditeur : le tableau des jalons de la war room.
  stations.push({
    number: 15,
    screenPosition: [11.6, 1.6, -9.8],
    screenRotationY: 0,
    screenSize: [3.5, 1.5],
    interactionRadius: 3,
  })

  // --- Mur de concept art (centre) -----------------------------------------------------
  add({
    name: 'concept_wall',
    material: 'board',
    position: [0, 1.25, -1.2],
    size: [5, 2.3, 0.12],
    collider: true,
  })
  const prints: Array<[number, number, number, number, string]> = [
    [-1.85, 1.75, 1.0, 0.62, '#4f6a7a'],
    [-0.6, 1.8, 1.2, 0.7, '#9fb4b8'],
    [0.75, 1.75, 1.1, 0.62, '#d9a35c'],
    [1.95, 1.8, 0.8, 0.55, '#6e7f6a'],
    [-1.6, 0.85, 1.2, 0.68, '#2f4256'],
    [-0.2, 0.9, 1.0, 0.75, '#c7c3b4'],
    [1.25, 0.85, 1.5, 0.66, '#8a5a44'],
  ]
  prints.forEach(([x, y, w, h, color], i) =>
    add({
      name: `concept_print_${i}`,
      material: 'postit',
      position: [x, y, -1.13],
      size: [w, h, 0.01],
      color,
      collider: false,
    }),
  )

  // --- Îlots de postes -----------------------------------------------------------------
  addAll(deskIsland('island_design', [-3.6, -7], 0, [1, 2, 3, 4]))
  addAll(deskIsland('island_art', [3.6, -7], 0, [5, 6, 7, 10]))
  addAll(deskIsland('island_code', [-3.6, 4.4], 0, [8, 9, 12, 13]))

  // --- Cuisine et coin détente (sud-est) -----------------------------------------------
  add(
    {
      name: 'kitchen_counter',
      material: 'wood',
      position: [14.55, 0.45, 6.6],
      size: [0.7, 0.9, 4.6],
      collider: true,
    },
    {
      name: 'kitchen_fridge',
      material: 'darkMetal',
      position: [14.55, 0.95, 3.8],
      size: [0.7, 1.9, 0.7],
      collider: true,
    },
    {
      name: 'coffee_machine',
      material: 'darkMetal',
      position: [14.6, 1.1, 5.4],
      size: [0.4, 0.4, 0.4],
      collider: false,
    },
    {
      name: 'cafe_bar_table',
      material: 'wood',
      position: [11.4, 0.525, 6.4],
      size: [2.4, 1.05, 0.9],
      collider: true,
    },
    {
      name: 'arcade_cabinet',
      material: 'darkMetal',
      position: [8.6, 0.9, 9.35],
      size: [0.75, 1.8, 0.75],
      collider: true,
    },
    {
      name: 'lounge_sofa',
      material: 'sofa',
      position: [11.4, 0.4, 9.2],
      size: [2.4, 0.8, 0.9],
      collider: true,
    },
  )

  // --- Ludothèque (sud-ouest) : jeux et consoles du studio ------------------------------
  add(
    {
      name: 'game_shelf',
      material: 'wood',
      position: [-14.6, 1.1, 6.5],
      size: [0.6, 2.2, 3.6],
      collider: true,
    },
    {
      name: 'library_sofa',
      material: 'sofa',
      position: [-11.6, 0.4, 9.2],
      size: [2.4, 0.8, 0.9],
      collider: true,
    },
    {
      name: 'library_low_table',
      material: 'wood',
      position: [-11.6, 0.2, 7.9],
      size: [1.2, 0.4, 0.6],
      collider: true,
    },
  )

  // --- Accueil (sud, point de départ) --------------------------------------------------
  add(
    {
      name: 'reception_desk',
      material: 'wood',
      position: [4.6, 0.55, 7.9],
      size: [2.6, 1.1, 0.8],
      collider: true,
    },
    {
      name: 'reception_logo',
      material: 'accent',
      position: [4.6, 2.3, HALF_D - 0.13],
      size: [3, 0.7, 0.05],
      collider: false,
    },
    {
      name: 'poster_brume',
      material: 'white',
      position: [-3.4, 1.7, HALF_D - 0.13],
      size: [1, 1.4, 0.03],
      collider: false,
    },
    {
      name: 'poster_petits_cailloux',
      material: 'white',
      position: [-5, 1.7, HALF_D - 0.13],
      size: [1, 1.4, 0.03],
      collider: false,
    },
  )

  // --- Plantes ---------------------------------------------------------------------------
  const plants: Vec2[] = [
    [-8.2, -9.4],
    [8.2, -3.8],
    [-7.8, 2.4],
    [7.8, 2.4],
    [14.3, -3.8],
    [-8.4, 9.4],
    [7.4, 9.4],
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
      id: 'playtest',
      label: 'Salle de playtest',
      min: [-HALF_W, -HALF_D],
      max: [-9, -4.5],
      floor: 'carpet',
    },
    { id: 'sound', label: 'Cabine son', min: [-HALF_W, -3.4], max: [-11, 0.6], floor: 'carpet' },
    {
      id: 'warroom',
      label: 'War room',
      min: [9, -HALF_D],
      max: [HALF_W, -4.5],
      floor: 'carpet',
    },
    {
      id: 'design',
      label: 'Îlot Design et Narration',
      min: [-6.4, -9.5],
      max: [-0.8, -4.5],
      floor: 'woodFloor',
    },
    { id: 'art', label: 'Îlot Art', min: [0.8, -9.5], max: [6.4, -4.5], floor: 'woodFloor' },
    {
      id: 'code',
      label: 'Îlot Code, Production et QA',
      min: [-6.4, 1.9],
      max: [-0.8, 6.9],
      floor: 'woodFloor',
    },
    {
      id: 'concept',
      label: 'Mur de concept art',
      min: [-2.8, -0.6],
      max: [2.8, 1.6],
      floor: 'rug',
    },
    {
      id: 'cafe',
      label: 'Cuisine et détente',
      min: [8.2, 3],
      max: [HALF_W, HALF_D],
      floor: 'woodFloor',
    },
    {
      id: 'library',
      label: 'Ludothèque',
      min: [-HALF_W, 4.5],
      max: [-9, HALF_D],
      floor: 'rug',
    },
  ]

  return {
    width: WIDTH,
    depth: DEPTH,
    wallHeight: WALL_H,
    spawn: { position: [0.6, 0, 7.6], rotationY: Math.PI },
    zones,
    boxes,
    stations: stations.sort((a, b) => a.number - b.number),
  }
}

export const plan: FloorPlan = buildFloorPlan()
