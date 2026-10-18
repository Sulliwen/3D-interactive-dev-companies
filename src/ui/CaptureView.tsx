import { getStationByNumber } from '../content/loader'
import { ScreenFrame } from '../stations/ScreenFrame'

/**
 * Affiche un écran simulé seul, figé, pour en faire l'image vue de loin
 * (`npm run screens:capture` ouvre `?capture=8`, `?capture=9`…).
 */
export function CaptureView({ number }: { number: number }) {
  const station = getStationByNumber(number)
  if (!station?.details) return <p id="capture-missing">Aucun écran pour le poste {number}.</p>
  return (
    <div id="capture" style={{ display: 'inline-block' }}>
      <ScreenFrame station={station} live={false} />
    </div>
  )
}
