import { nextStation } from '../../state/progress'
import { useProgress, useVisit } from '../../state/visit'
import { floorPlan, type StationAnchor } from '../world/floorplan'

/** Prochain poste du parcours (non encore vu), avec son ancre dans la scène. */
export function useNextStation(): { number: number; anchor: StationAnchor } | null {
  const visit = useVisit()
  const progress = useProgress()
  const id = nextStation(
    progress,
    visit.pathStations.map((s) => s.id),
  )
  const station = visit.pathStations.find((s) => s.id === id)
  const anchor = station && floorPlan.stations.find((a) => a.number === station.desk)
  return station && anchor ? { number: station.desk, anchor } : null
}
