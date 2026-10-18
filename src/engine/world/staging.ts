import type { Vec3 } from './floorplan'
import { getVisit } from '../../content/loader'
import { obstaclesOf, type NpcPlacement } from './npcs'
import { WORLDS, worldOf } from './worlds'

/**
 * Mise en scène propre à chaque scénario : ce qui change dans l'étage quand on change de
 * type de développement. Les titulaires des postes restent à leur bureau ; les figurants
 * se déplacent, et des panneaux (tableaux, affiches) apparaissent.
 */

/** Panneau dessiné à l'exécution (pas d'éclairage précalculé : il change avec le scénario). */
export interface BoardProp {
  id: string
  position: Vec3
  rotationY: number
  /** Largeur et hauteur, en mètres. */
  size: readonly [width: number, height: number]
  /** Fond du panneau (tableau blanc, affiche…). */
  background: string
  title: string
  subtitle?: string
  /** Colonnes de cartes, façon post-it (titre de colonne, cartes). */
  columns?: Array<{ title: string; cards: string[] }>
  /** Lignes de texte simples, si pas de colonnes. */
  lines?: string[]
}

export interface Staging {
  /** Remplace les figurants par défaut (les titulaires des postes ne bougent pas). */
  figurants?: NpcPlacement[]
  boards?: BoardProp[]
}

export function stagingFor(visitKey: string): Staging {
  const [structure = ''] = visitKey.split('/')
  return worldOf(structure).staging[visitKey] ?? {}
}

/** Tous les personnages de l'étage pour une visite (sans ceux qui ne sont pas encore arrivés). */
export function npcsFor(visitKey: string): NpcPlacement[] {
  const [structure = '', scenario = ''] = visitKey.split('/')
  const absent = new Set(
    getVisit({ structure, scenario })
      .stations.filter((s) => s.absent)
      .map((s) => s.desk),
  )
  const world = worldOf(structure)
  return [...world.stationNpcs, ...(stagingFor(visitKey).figurants ?? world.figurants)].filter(
    (n) => n.station === undefined || !absent.has(n.station),
  )
}

const obstacles = new Map<string, ReturnType<typeof obstaclesOf>>()

/** Les personnages debout de cette visite, comme obstacles (collisions, itinéraires). */
export function npcObstaclesFor(visitKey: string) {
  let o = obstacles.get(visitKey)
  if (!o) {
    o = obstaclesOf(npcsFor(visitKey))
    obstacles.set(visitKey, o)
  }
  return o
}

export const stagedVisits = (): string[] =>
  Object.values(WORLDS).flatMap((w) => Object.keys(w.staging))
