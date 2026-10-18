import type { StationAnchor, Vec3 } from '../world/floorplan'

export interface ViewportFit {
  /** Champ de vision vertical de la caméra, en degrés. */
  fovDeg: number
  /** Largeur / hauteur de la zone de rendu. */
  aspect: number
  /** Part de la largeur laissée libre par la fiche latérale (0 à 1). */
  availableFraction: number
}

export interface ScreenPose {
  position: Vec3
  /** Direction du regard (unitaire). */
  direction: Vec3
}

/** Part maximale de la hauteur de la fenêtre occupée par l'écran zoomé. */
const HEIGHT_FILL = 0.8
/** Part maximale de la largeur disponible occupée par l'écran zoomé. */
const WIDTH_FILL = 0.94

/**
 * Position de la caméra face à un écran : assez loin pour qu'il tienne entier dans
 * la fenêtre, et décalée pour qu'il soit centré dans la partie non couverte par la fiche.
 */
export function computeScreenPose(anchor: StationAnchor, fit: ViewportFit): ScreenPose {
  const [w, h] = anchor.screenSize
  const tan = Math.tan((fit.fovDeg * Math.PI) / 360)
  const a = Math.min(1, Math.max(0.3, fit.availableFraction))

  const distForHeight = h / HEIGHT_FILL / (2 * tan)
  const distForWidth = w / (WIDTH_FILL * a) / (2 * tan * fit.aspect)
  const d = Math.max(distForHeight, distForWidth)
  // Décaler la caméra vers la droite de l'écran le fait apparaître plus à gauche.
  const shift = (1 - a) * d * tan * fit.aspect

  const r = anchor.screenRotationY
  const nx = Math.sin(r)
  const nz = Math.cos(r)
  const rightX = Math.cos(r)
  const rightZ = -Math.sin(r)
  const [cx, cy, cz] = anchor.screenPosition

  return {
    position: [cx + nx * d + rightX * shift, cy, cz + nz * d + rightZ * shift],
    direction: [-nx, 0, -nz],
  }
}

/** Plan de la présentation : d'où regarde la caméra, et quel point elle vise. */
export interface TourShot {
  position: Vec3
  target: Vec3
}

/**
 * Plan d'un poste pendant la présentation : en hauteur, de trois quarts derrière la
 * personne assise, pour voir à la fois la personne et son écran.
 */
export function computeTourShot(anchor: StationAnchor): TourShot {
  const [w] = anchor.screenSize
  const r = anchor.screenRotationY
  const nx = Math.sin(r)
  const nz = Math.cos(r)
  const rightX = Math.cos(r)
  const rightZ = -Math.sin(r)
  const [cx, cy, cz] = anchor.screenPosition
  const back = 1.7 + w * 0.9
  const side = 0.8 + w * 0.3
  return {
    position: [cx + nx * back + rightX * side, cy + 0.95, cz + nz * back + rightZ * side],
    target: [cx + nx * 0.35, cy - 0.15, cz + nz * 0.35],
  }
}
