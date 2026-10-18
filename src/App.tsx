import { Suspense, useEffect } from 'react'
import { Experience } from './engine/Experience'
import { attachKeyboard } from './engine/player/input'
import { Hud } from './ui/Hud'
import { LoadingScreen } from './ui/LoadingScreen'
import { isExploring, useGameStore } from './state/useGameStore'

export function App() {
  useEffect(() => attachKeyboard(), [])
  useEffect(() => attachGlobalShortcuts(), [])
  useAccessibilitySettings()

  return (
    <div className="app">
      <Suspense fallback={null}>
        <Experience />
      </Suspense>
      <LoadingScreen />
      <Hud />
    </div>
  )
}

function attachGlobalShortcuts(): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.repeat || (e.target instanceof HTMLElement && e.target.tagName === 'INPUT')) return
    const store = useGameStore.getState()
    if (e.code === 'KeyE' && store.nearbyStation !== null && isExploring(store)) {
      store.openStation(store.nearbyStation)
    }
    if (import.meta.env.DEV && e.code === 'F2') {
      e.preventDefault()
      store.togglePerf()
    }
    if (import.meta.env.DEV && e.code === 'F3') {
      e.preventDefault()
      store.toggleDebugPhysics()
    }
    if (import.meta.env.DEV && e.code === 'F4') {
      e.preventDefault()
      store.toggleBlockout()
    }
  }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}

/** Applique les réglages d'accessibilité à toute la page (y compris les écrans 3D). */
function useAccessibilitySettings() {
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion)
  const textScale = useGameStore((s) => s.settings.textScale)
  useEffect(() => {
    const root = document.documentElement
    root.dataset.reducedMotion = String(reducedMotion)
    root.style.setProperty('--text-scale', String(textScale))
  }, [reducedMotion, textScale])
}
