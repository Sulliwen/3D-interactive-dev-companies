import { findStructure, getVisit } from '../content/loader'
import { ScreenFrame } from '../stations/ScreenFrame'

/**
 * Affiche un écran simulé seul, figé, pour en faire l'image vue de loin
 * (`npm run screens:capture` ouvre `?capture=atelier-lumen/preparer-v2/8`…).
 */
export function CaptureView({ target }: { target: string }) {
  const [structure = '', scenario = '', desk = ''] = target.split('/')
  const known = findStructure(structure)?.scenarios.some((s) => s.scenario.id === scenario)
  const station = known
    ? getVisit({ structure, scenario }).stations.find(
        (s) => s.desk === Number(desk) && s.screenScenario === scenario,
      )
    : undefined
  if (!station?.screen) return <p id="capture-missing">Aucun écran pour « {target} ».</p>
  return (
    <div id="capture" style={{ display: 'inline-block' }}>
      <ScreenFrame station={station} live={false} />
    </div>
  )
}
