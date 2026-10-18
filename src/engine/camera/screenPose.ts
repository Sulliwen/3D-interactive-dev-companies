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
