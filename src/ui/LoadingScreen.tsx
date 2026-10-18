import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { useVisit } from '../state/visit'

const TIPS = [
  'Une dizaine de métiers font avancer un même travail.',
  'À chaque poste, les pastilles orange expliquent l’écran.',
  'Tous les mots techniques sont expliqués dans le glossaire.',
]

/**
 * Écran de chargement : progression réelle des modèles 3D (l'étage d'abord, puis les
 * personnages), puis fondu vers la visite.
 */
export function LoadingScreen() {
  const { progress, active } = useProgress()
  const { structure } = useVisit()
  const [gone, setGone] = useState(false)
  const done = !active && progress >= 100

  useEffect(() => {
    if (!done) return
    const id = window.setTimeout(() => setGone(true), 600)
    return () => window.clearTimeout(id)
  }, [done])

  if (gone) return null
  return (
    <div className={`loading ${done ? 'loading--done' : ''}`} role="status" aria-live="polite">
      <div className="loading__sun" aria-hidden="true" />
      <p className="loading__brand">{structure.name}</p>
      <p>{structure.tagline}</p>
      <div className="loading__bar" aria-hidden="true">
        <span style={{ width: `${Math.round(progress)}%` }} />
      </div>
      <p className="loading__hint">Chargement de l'étage… {Math.round(progress)} %</p>
      <p className="loading__tip">{TIPS[Math.floor(progress / 34) % TIPS.length]}</p>
    </div>
  )
}
