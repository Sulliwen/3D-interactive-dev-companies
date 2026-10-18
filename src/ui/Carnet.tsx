import { useState } from 'react'
import { pathStations, stations } from '../content/loader'
import { floorPlan } from '../engine/world/floorplan'
import { standPoint } from '../engine/stations/standPoint'
import { useNextStation } from '../engine/stations/useNextStation'
import { visitedCount } from '../state/progress'
import { useGameStore } from '../state/useGameStore'
import { useEscape } from './escapeStack'

const pathIds = pathStations.map((s) => s.id)

/** Carnet de visite : étape en cours, chaîne complète des postes, accès direct à chacun. */
export function Carnet() {
  const [open, setOpen] = useState(false)
  const progress = useGameStore((s) => s.progress)
  const openCatalog = useGameStore((s) => s.openCatalog)
  const setMoveTarget = useGameStore((s) => s.setMoveTarget)
  const openFinale = useGameStore((s) => s.openFinale)
  const next = useNextStation()
  const count = visitedCount(progress, pathIds)
  const done = next === null
  const nextData = next && stations.find((s) => s.number === next.number)
  useEscape(() => setOpen(false), open)

  const goTo = (n: number) => {
    const anchor = floorPlan.stations.find((a) => a.number === n)
    if (!anchor) return
    const [x, z] = standPoint(anchor)
    setMoveTarget([x, 0, z])
    setOpen(false)
  }

  return (
    <div className="carnet">
      <button
        type="button"
        className="carnet__toggle"
        aria-expanded={open}
        aria-controls="carnet-panel"
        onClick={() => setOpen((o) => !o)}
      >
        <strong>Carnet de visite</strong>
        <span className="carnet__step">
          {done ? 'Visite terminée !' : `Étape ${next.number} sur ${pathStations.length}`}
        </span>
        {nextData && <span className="carnet__next"> · {nextData.title}</span>}
        <span aria-hidden="true"> {open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div id="carnet-panel" className="carnet__panel">
          {done && (
            <button type="button" className="button carnet__finale" onClick={() => openFinale()}>
              Voir le récapitulatif de la visite
            </button>
          )}
          <p className="carnet__summary">
            {count} poste{count > 1 ? 's' : ''} vu{count > 1 ? 's' : ''} sur {pathStations.length}.
            Suivez la ligne lumineuse au sol, ou choisissez un poste.
          </p>
          <ol className="carnet__list">
            {stations.map((s) => {
              const seen = progress.visited.includes(s.id)
              const isNext = next?.number === s.number
              return (
                <li key={s.id} className={`${seen ? 'is-seen' : ''} ${isNext ? 'is-next' : ''}`}>
                  <span className="carnet__mark" aria-hidden="true">
                    {seen ? '✓' : s.offPath ? '★' : s.number}
                  </span>
                  <span className="carnet__text">
                    <span className="carnet__title">
                      {s.title}
                      {seen && <span className="visually-hidden"> (déjà vu)</span>}
                      {isNext && <em> · prochain</em>}
                    </span>
                    <span className="carnet__feature">{s.featureStep}</span>
                  </span>
                  <span className="carnet__actions">
                    <button type="button" onClick={() => goTo(s.number)}>
                      Y aller
                    </button>
                    <button type="button" onClick={() => openCatalog(s.number)}>
                      Fiche
                    </button>
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}
