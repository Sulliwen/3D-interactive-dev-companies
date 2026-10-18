import { getVisit, type Visit } from '../content/loader'
import type { Progress } from './progress'
import { currentProgress, useGameStore } from './useGameStore'

/** La visite en cours (structure et scénario choisis, ou la visite par défaut à l'accueil). */
export function useVisit(): Visit {
  return getVisit(useGameStore((s) => s.visit))
}

/** Progression de la visite en cours. */
export function useProgress(): Progress {
  return useGameStore(currentProgress)
}
