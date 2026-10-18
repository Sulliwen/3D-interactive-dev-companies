import type { AnimationMixer, Object3D, SkinnedMesh } from 'three'

/** Personnage animé, suivi par le gestionnaire (visibilité, niveau de détail, cadence). */
export interface CharacterEntry {
  group: Object3D
  mixer: AnimationMixer
  lod0: SkinnedMesh | null
  lod1: SkinnedMesh | null
  /** Poste occupé : le titulaire s'efface quand on zoome sur son écran. */
  station?: number
  /** Temps accumulé depuis la dernière mise à jour de l'animation. */
  pending: number
  distance: number
}

export const characters: CharacterEntry[] = []

export function registerCharacter(entry: CharacterEntry): () => void {
  characters.push(entry)
  return () => {
    const i = characters.indexOf(entry)
    if (i !== -1) characters.splice(i, 1)
  }
}

/** Au-delà, le personnage passe en version allégée (LOD1). */
export const LOD_DISTANCE = 9
/** Au-delà, l'animation tourne à 10 images par seconde. */
export const SLOW_DISTANCE = 12
/** Nombre maximal de personnages animés en même temps (les plus proches). */
export const MAX_ANIMATED = 20

export interface Plan {
  visible: boolean
  lod: 0 | 1
  /** Pas de temps minimal entre deux mises à jour ; `null` : animation gelée. */
  step: number | null
}

/**
 * Décide, pour chaque personnage, s'il est dessiné, en quelle version et à quelle cadence.
 * `inView` : dans le champ de la caméra ; triés ensuite par distance.
 */
export function planCharacters(
  items: ReadonlyArray<{ distance: number; inView: boolean; hidden: boolean }>,
  budget: { lodDistance: number; maxAnimated: number } = {
    lodDistance: LOD_DISTANCE,
    maxAnimated: MAX_ANIMATED,
  },
): Plan[] {
  const order = items
    .map((it, i) => ({ ...it, i }))
    .filter((it) => it.inView && !it.hidden)
    .sort((a, b) => a.distance - b.distance)
  const plans: Plan[] = items.map(() => ({ visible: false, lod: 1, step: null }))
  order.forEach((it, rank) => {
    plans[it.i] = {
      visible: true,
      lod: it.distance < budget.lodDistance ? 0 : 1,
      step: rank >= budget.maxAnimated ? null : it.distance < SLOW_DISTANCE ? 0 : 0.1,
    }
  })
  return plans
}
