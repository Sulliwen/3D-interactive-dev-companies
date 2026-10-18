import { Vector3 } from 'three'

/**
 * État partagé entre l'avatar et la caméra, mis à jour à chaque image.
 * Volontairement hors de React/Zustand : le modifier ne doit déclencher aucun rendu.
 */
export const runtime = {
  playerPosition: new Vector3(),
  /** Orientation horizontale de la caméra (radians, 0 = regarde vers +Z). */
  cameraYaw: 0,
  cameraPosition: new Vector3(),
  /** Orientation de l'avatar (radians, 0 = regarde vers +Z). */
  playerYaw: 0,
  /** Vitesse horizontale de l'avatar (m/s), pour ses animations. */
  playerSpeed: 0,
  /** Itinéraire du parcours guidé (vers le prochain poste), ou `null`. */
  guidePath: null as ReadonlyArray<readonly [number, number]> | null,
  /** État de la caméra : suivi de l'avatar, zoom sur un écran, ou transition. */
  cameraMode: 'follow' as 'follow' | 'toScreen' | 'screen' | 'toFollow',
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { __runtime: typeof runtime }).__runtime = runtime
}
