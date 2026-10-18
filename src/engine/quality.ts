import type { Quality } from '../state/useGameStore'

export interface QualityProfile {
  dpr: number | [number, number]
  shadows: boolean
  shadowMapSize: number
  /** Post-traitement : antialiasing SMAA, léger halo lumineux, rendu des couleurs AgX. */
  postprocessing: boolean
  /** Personnages : distance de passage en version allégée, nombre maximal animés. */
  characters: { lodDistance: number; maxAnimated: number }
}

/** « Basse » : résolution native, ni ombres ni post-traitement. « Élevée » : tout activé. */
export const QUALITY: Record<Quality, QualityProfile> = {
  low: {
    dpr: 1,
    shadows: false,
    shadowMapSize: 1024,
    postprocessing: false,
    characters: { lodDistance: 6, maxAnimated: 10 },
  },
  high: {
    dpr: [1, 1.5],
    shadows: true,
    shadowMapSize: 2048,
    postprocessing: true,
    characters: { lodDistance: 9, maxAnimated: 20 },
  },
}
