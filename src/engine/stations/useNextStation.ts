import { pathStations } from '../../content/loader'
import { nextStation } from '../../state/progress'
import { useGameStore } from '../../state/useGameStore'
import { floorPlan, type StationAnchor } from '../world/floorplan'

const pathIds = pathStations.map((s) => s.id)

/** Prochain poste du fil rouge (non encore vu), avec son ancre dans la scène. */
export function useNextStation(): { number: number; anchor: StationAnchor } | null {
  const progress = useGameStore((s) => s.progress)
  const id = nextStation(progress, pathIds)
  const station = pathStations.find((s) => s.id === id)
  const anchor = station && floorPlan.stations.find((a) => a.number === station.number)
  return station && anchor ? { number: station.number, anchor } : null
}
