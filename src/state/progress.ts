/** Logique pure de progression du visiteur (sans React ni stockage). */

export interface Progress {
  /** Identifiants des postes déjà regardés, dans l'ordre de découverte. */
  visited: string[]
}

export const emptyProgress: Progress = { visited: [] }

export function markVisited(progress: Progress, stationId: string): Progress {
  if (progress.visited.includes(stationId)) return progress
  return { visited: [...progress.visited, stationId] }
}

/**
 * Prochain poste du parcours guidé : le premier, dans l'ordre du fil rouge,
 * qui n'a pas encore été vu. `null` quand tout a été visité.
 */
export function nextStation(progress: Progress, orderedIds: readonly string[]): string | null {
  return orderedIds.find((id) => !progress.visited.includes(id)) ?? null
}

/** Nombre de postes vus parmi ceux qui existent encore dans le contenu. */
export function visitedCount(progress: Progress, orderedIds: readonly string[]): number {
  return orderedIds.filter((id) => progress.visited.includes(id)).length
}

/** Nettoie une progression relue du stockage (données anciennes ou corrompues). */
export function sanitizeProgress(raw: unknown, knownIds: readonly string[]): Progress {
  if (typeof raw !== 'object' || raw === null || !('visited' in raw)) return emptyProgress
  const { visited } = raw as { visited: unknown }
  if (!Array.isArray(visited)) return emptyProgress
  const known = new Set(knownIds)
  const unique = [
    ...new Set(visited.filter((v): v is string => typeof v === 'string' && known.has(v))),
  ]
  return { visited: unique }
}
