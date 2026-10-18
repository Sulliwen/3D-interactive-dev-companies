import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { company, getStationByNumber, stations } from '../content/loader'
import { useGameStore } from '../state/useGameStore'
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
  const visited = useGameStore((s) => s.progress.visited)
  const station = current === null ? undefined : getStationByNumber(current)

  useEffect(() => {
    if (station?.details) visitStation(station.id)
  }, [station, visitStation])

  return (
    <Dialog title="Tous les postes" onClose={closeOverlay} className="dialog--wide">
      <div className="catalog">
        <nav className="catalog__nav" aria-label="Postes, dans l'ordre de la chaîne">
          <ol>
            {stations.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  aria-current={s.number === current ? 'true' : undefined}
                  className={s.number === current ? 'is-current' : ''}
                  onClick={() => openCatalog(s.number)}
                >
                  <span className="catalog__num">{s.number}</span>
                  <span>
                    {s.title}
                    {visited.includes(s.id) && <span className="catalog__seen"> · vu</span>}
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
              <p className="sheet__label">Le fil rouge de la visite</p>
              <p className="catalog__feature">« {company.feature.title} »</p>
              <p>
                Chez {company.name}, quatorze métiers font avancer cette fonctionnalité de
                l'application Pocket Santé, du premier message d'un patient mécontent jusqu'aux
                statistiques après la mise en ligne. Choisissez un poste dans la liste pour voir son
                écran et sa fiche.
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
