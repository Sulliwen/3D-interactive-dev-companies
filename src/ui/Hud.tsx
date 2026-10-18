import { useEffect, useState } from 'react'
import { stationAtDesk, stationLabel } from '../content/loader'
import { movementKeyLabels } from '../engine/player/input'
import { useGameStore } from '../state/useGameStore'
import { Carnet } from './Carnet'
import { Catalog } from './Catalog'
import { Minimap } from './Minimap'
import { GlossaryPanel } from './GlossaryPanel'
import { SettingsPanel } from './SettingsPanel'
import { ZoomOverlay } from './ZoomOverlay'
import { LaunchMenu } from './LaunchMenu'
import { Presentation } from './Presentation'
import { Tutorial } from './Tutorial'
import { Finale } from './Finale'
import { visitedCount } from '../state/progress'
import { useProgress, useVisit } from '../state/visit'

/** Interface affichée par-dessus la 3D (hors du canvas). */
export function Hud() {
  const [keys, setKeys] = useState('ZQSD')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const zoomed = useGameStore((s) => s.activeStation !== null)
  const overlay = useGameStore((s) => s.overlay)
  const openCatalog = useGameStore((s) => s.openCatalog)
  const openGlossary = useGameStore((s) => s.openGlossary)
  const openMenu = useGameStore((s) => s.openMenu)
  const touring = useGameStore((s) => s.tour !== null)
  const visit = useVisit()

  useEffect(() => {
    let alive = true
    void movementKeyLabels().then((k) => alive && setKeys(k))
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="hud">
      {!touring && (
        <header className="hud__top">
          {!zoomed && (
            <>
              <p className="hud__brand">
                {visit.structure.name} <span>· {visit.scenario.title}</span>
              </p>
              <Carnet />
            </>
          )}
          <nav className="hud__menu" aria-label="Menu">
            <button type="button" className="button button--ghost" onClick={() => openMenu()}>
              Menu
            </button>
            <button type="button" className="button button--ghost" onClick={() => openCatalog()}>
              Tous les postes
            </button>
            <button type="button" className="button button--ghost" onClick={() => openGlossary()}>
              Glossaire
            </button>
            <button
              type="button"
              className="button"
              aria-expanded={settingsOpen}
              aria-controls="settings-panel"
              onClick={() => setSettingsOpen((o) => !o)}
            >
              Réglages
            </button>
          </nav>
        </header>
      )}

      {zoomed && <ZoomOverlay />}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      {!zoomed && !touring && <InteractionPrompt />}
      <Toast />

      {!zoomed && <Minimap />}

      {!zoomed && !touring && (
        <footer className="hud__help" aria-label="Commandes">
          <span>
            <kbd>{keys}</kbd> ou <kbd>flèches</kbd> : se déplacer
          </span>
          <span>
            <kbd>Maj</kbd> : aller plus vite
          </span>
          <span>Glisser la souris : regarder autour</span>
          <span>Clic au sol : y aller</span>
          {import.meta.env.DEV && (
            <span className="hud__dev">
              <kbd>F2</kbd> stats · <kbd>F3</kbd> collisions
            </span>
          )}
        </footer>
      )}

      {overlay === 'catalog' && <Catalog />}
      {overlay === 'glossary' && <GlossaryPanel />}
      {overlay === 'finale' && <Finale />}
      <Presentation />
      <LaunchMenu />
      {!zoomed && overlay === 'none' && <Tutorial />}
      <FinaleTrigger />
    </div>
  )
}

function InteractionPrompt() {
  const nearby = useGameStore((s) => s.nearbyStation)
  const overlay = useGameStore((s) => s.overlay)
  const openStation = useGameStore((s) => s.openStation)
  const visit = useVisit()
  if (nearby === null || overlay !== 'none') return null
  const station = stationAtDesk(visit, nearby)

  return (
    <div className="prompt" aria-live="polite">
      <button type="button" className="prompt__button" onClick={() => openStation(nearby)}>
        <kbd>E</kbd> Regarder l'écran
      </button>
      <p className="prompt__station">
        {station ? stationLabel(station) : `Poste ${nearby}`}
        {station?.absent ? (
          <> · bureau vide</>
        ) : (
          station?.status === 'bystander' && <> · hors de ce scénario</>
        )}
        {station?.status === 'bonus' && <> · poste bonus</>}
      </p>
    </div>
  )
}

function Toast() {
  const toast = useGameStore((s) => s.toast)
  const showToast = useGameStore((s) => s.showToast)
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => showToast(null), 3000)
    return () => window.clearTimeout(id)
  }, [toast, showToast])

  return (
    <div className="toast" role="status" aria-live="polite">
      {toast}
    </div>
  )
}

/** Ouvre l'écran de fin, une fois par visite, quand la dernière étape du parcours a été vue. */
function FinaleTrigger() {
  const visit = useVisit()
  const progress = useProgress()
  const zoomed = useGameStore((s) => s.activeStation !== null)
  const shown = useGameStore((s) => s.finalesShown.includes(visit.key))
  const openFinale = useGameStore((s) => s.openFinale)
  const pathIds = visit.pathStations.map((s) => s.id)
  const complete = visitedCount(progress, pathIds) === pathIds.length
  useEffect(() => {
    // Après être revenu de l'écran du dernier poste.
    if (complete && !zoomed && !shown) openFinale()
  }, [complete, zoomed, shown, openFinale])
  return null
}
