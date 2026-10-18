import { useState } from 'react'
import { useWorld } from '../engine/world/worlds'
import { standPoint } from '../engine/stations/standPoint'
import { useNextStation } from '../engine/stations/useNextStation'
import { visitedCount } from '../state/progress'
import { useGameStore } from '../state/useGameStore'
import { useProgress, useVisit } from '../state/visit'
import { useEscape } from './escapeStack'

/** Carnet de visite : étape en cours, chaîne complète des postes, accès direct à chacun. */
export function Carnet() {
  const floorPlan = useWorld().plan
  const [open, setOpen] = useState(false)
  const visit = useVisit()
  const progress = useProgress()
  const openCatalog = useGameStore((s) => s.openCatalog)
  const setMoveTarget = useGameStore((s) => s.setMoveTarget)
  const openFinale = useGameStore((s) => s.openFinale)
  const next = useNextStation()
  const count = visitedCount(
    progress,
    visit.pathStations.map((s) => s.id),
  )
  const total = visit.pathStations.length
  const done = next === null
  const nextData = next && visit.stations.find((s) => s.desk === next.number)
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
          {done ? 'Visite terminée !' : `Étape ${nextData?.step} sur ${total}`}
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
            <strong>{visit.scenario.title}</strong> · {count} étape{count > 1 ? 's' : ''} vue
            {count > 1 ? 's' : ''} sur {total}. Suivez la ligne lumineuse au sol, ou choisissez un
            poste.
          </p>
          <ol className="carnet__list">
            {visit.stations.map((s) => {
              const seen = s.status !== 'bystander' && progress.visited.includes(s.id)
              const isNext = next?.number === s.desk
              const bystander = s.status === 'bystander'
              return (
                <li
                  key={s.id}
                  className={`${seen ? 'is-seen' : ''} ${isNext ? 'is-next' : ''} ${bystander ? 'is-bystander' : ''}`}
                >
                  <span className="carnet__mark" aria-hidden="true">
                    {seen ? '✓' : s.status === 'bonus' ? '★' : bystander ? '–' : s.step}
                  </span>
                  <span className="carnet__text">
                    <span className="carnet__title">
                      {s.title}
                      {seen && <span className="visually-hidden"> (déjà vu)</span>}
                      {isNext && <em> · prochain</em>}
                    </span>
                    <span className="carnet__feature">
                      {s.absent
                        ? 'Pas encore là'
                        : bystander
                          ? 'Hors de ce scénario'
                          : s.featureStep}
                    </span>
                  </span>
                  <span className="carnet__actions">
                    <button type="button" onClick={() => goTo(s.desk)}>
                      Y aller
                    </button>
                    <button type="button" onClick={() => openCatalog(s.desk)}>
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
