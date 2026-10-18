import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getStationByNumber } from '../content/loader'
import { useGameStore } from '../state/useGameStore'
import { useEscape } from './escapeStack'
import { StationSheet } from './StationSheet'

/** Largeur sous laquelle la fiche passe par-dessus l'écran au lieu d'être à côté. */
const NARROW = 900

/** Interface affichée pendant qu'on regarde l'écran d'un poste. */
export function ZoomOverlay() {
  const active = useGameStore((s) => s.activeStation)
  const closeStation = useGameStore((s) => s.closeStation)
  const setSheetWidth = useGameStore((s) => s.setSheetWidth)
  const requestAnnotation = useGameStore((s) => s.requestAnnotation)
  const station = active === null ? undefined : getStationByNumber(active)
  const panel = useRef<HTMLElement>(null)
  const [narrow, setNarrow] = useState(() => window.innerWidth < NARROW)
  const [sheetOpen, setSheetOpen] = useState(() => window.innerWidth >= NARROW)
  useEscape(closeStation, active !== null)

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < NARROW)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // La caméra cadre l'écran dans la place laissée libre par la fiche.
  useLayoutEffect(() => {
    const el = panel.current
    if (!el || narrow || !sheetOpen) {
      setSheetWidth(0)
      return
    }
    const update = () => setSheetWidth(window.innerWidth - el.getBoundingClientRect().left)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => {
      observer.disconnect()
      setSheetWidth(0)
    }
  }, [narrow, sheetOpen, active, setSheetWidth])

  useEffect(() => {
    if (active !== null) panel.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
  }, [active])

  if (!station) return null

  return (
    <div className="zoom">
      <div className="zoom__bar">
        <button type="button" className="button" onClick={closeStation}>
          ← Retour à la visite <kbd>Échap</kbd>
        </button>
        {narrow && (
          <button
            type="button"
            className="button button--ghost zoom__toggle"
            aria-expanded={sheetOpen}
            onClick={() => setSheetOpen((o) => !o)}
          >
            {sheetOpen ? 'Masquer la fiche' : 'Fiche du poste'}
          </button>
        )}
      </div>

      {station.details && (
        <div className="zoom__hint">
          <button
            type="button"
            className="button"
            onClick={() => requestAnnotation(station.details!.screen.annotations[0]!.id)}
          >
            ▶ Parcourir les explications
          </button>
          <span>
            ou cliquez sur les pastilles orange <span className="zoom__dot">1</span> de l'écran.
          </span>
        </div>
      )}

      {sheetOpen && (
        <aside ref={panel} className={`zoom__sheet ${narrow ? 'zoom__sheet--overlay' : ''}`}>
          <StationSheet station={station} />
        </aside>
      )}
    </div>
  )
}
