import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { stationAtDesk } from '../content/loader'
import { useGameStore } from '../state/useGameStore'
import { useProgress, useVisit } from '../state/visit'
import { SCREEN_HEIGHT, SCREEN_WIDTH, ScreenFrame } from '../stations/ScreenFrame'
import type { Station } from '../content/schema'
import { Dialog } from './Dialog'
import { StationSheet } from './StationSheet'

/**
 * « Tous les postes » : tout le contenu pédagogique, sans la 3D (formateur,
 * ordinateur trop faible, navigation au clavier ou lecteur d'écran).
 */
export function Catalog() {
  const current = useGameStore((s) => s.catalogStation)
  const openCatalog = useGameStore((s) => s.openCatalog)
  const closeOverlay = useGameStore((s) => s.closeOverlay)
  const visitStation = useGameStore((s) => s.visitStation)
  const visit = useVisit()
  const visited = useProgress().visited
  const station = current === null ? undefined : stationAtDesk(visit, current)
  const { structure, scenario } = visit

  useEffect(() => {
    if (station && station.status !== 'bystander') visitStation(station.id)
  }, [station, visitStation])

  return (
    <Dialog title="Tous les postes" onClose={closeOverlay} className="dialog--wide">
      <div className="catalog">
        <nav className="catalog__nav" aria-label="Postes, dans l'ordre du parcours">
          <ol>
            {visit.stations.map((s) => (
              <li key={s.id} className={s.status === 'bystander' ? 'is-bystander' : ''}>
                <button
                  type="button"
                  aria-current={s.desk === current ? 'true' : undefined}
                  className={s.desk === current ? 'is-current' : ''}
                  onClick={() => openCatalog(s.desk)}
                >
                  <span className="catalog__num">
                    {s.status === 'bonus' ? '★' : s.status === 'bystander' ? '–' : s.step}
                  </span>
                  <span>
                    {s.title}
                    {s.status === 'bystander' && (
                      <span className="catalog__seen">
                        {s.absent ? ' · pas encore là' : ' · hors scénario'}
                      </span>
                    )}
                    {s.status !== 'bystander' && visited.includes(s.id) && (
                      <span className="catalog__seen"> · vu</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="catalog__detail">
          {station ? (
            <>
              <ScaledScreen key={station.id} station={station} />
              <StationSheet station={station} onNavigate={(n) => openCatalog(n)} />
            </>
          ) : (
            <div className="catalog__intro">
              <p className="sheet__label">
                {structure.name} · {scenario.title}
              </p>
              <p className="catalog__feature">« {scenario.workItem.title} »</p>
              <p>
                {scenario.intro} Choisissez un poste dans la liste pour voir son écran et sa fiche.
              </p>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}

/** L'écran simulé, réduit pour tenir dans la largeur disponible (et toujours interactif). */
function ScaledScreen({ station }: { station: Station }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.6)

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / SCREEN_WIDTH))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={box} className="catalog__screen" style={{ height: SCREEN_HEIGHT * scale }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ScreenFrame station={station} live />
      </div>
    </div>
  )
}
