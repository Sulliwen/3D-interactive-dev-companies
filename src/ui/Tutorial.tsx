import { useEffect, useRef, useState } from 'react'
import { runtime } from '../engine/runtime'
import { useGameStore } from '../state/useGameStore'

interface Step {
  title: string
  text: string
}

const STEPS: Step[] = [
  { title: 'Se déplacer', text: 'Z Q S D (ou W A S D) et les flèches, ou cliquez sur le sol.' },
  { title: 'Regarder autour', text: 'Maintenez le clic et glissez la souris.' },
  { title: 'Suivre le guide', text: 'La ligne orange au sol mène au prochain poste.' },
  { title: 'Regarder un écran', text: 'Près d’un poste, appuyez sur E (ou cliquez sur l’écran).' },
]

/**
 * Tutoriel d'une vingtaine de secondes, après l'accueil : chaque étape se valide d'elle-même
 * dès que le geste est fait. On peut le passer.
 */
export function Tutorial() {
  const welcomed = useGameStore((s) => s.settings.welcomed)
  const done = useGameStore((s) => s.settings.tutorialDone)
  const setSetting = useGameStore((s) => s.setSetting)
  const [step, setStep] = useState(0)
  const watch = useRef({ moved: 0, yaw: runtime.cameraYaw })

  useEffect(() => {
    if (!welcomed || done) return
    const id = window.setInterval(() => {
      const s = useGameStore.getState()
      const w = watch.current
      setStep((current) => {
        let next = current
        if (current === 0) {
          w.moved += runtime.playerSpeed > 0.4 ? 0.2 : 0
          if (w.moved >= 0.6) {
            w.yaw = runtime.cameraYaw
            next = 1
          }
        } else if (current === 1 && Math.abs(runtime.cameraYaw - w.yaw) > 0.5) next = 2
        else if (current === 2 && s.nearbyStation !== null) next = 3
        else if (current === 3 && s.activeStation !== null) next = 4
        return next
      })
    }, 200)
    return () => window.clearInterval(id)
  }, [welcomed, done])

  useEffect(() => {
    if (step >= STEPS.length) setSetting('tutorialDone', true)
  }, [step, setSetting])

  if (!welcomed || done || step >= STEPS.length) return null
  const current = STEPS[step]!

  return (
    <div className="tutorial" role="status" aria-live="polite">
      <p className="tutorial__count">
        Prise en main · {step + 1} / {STEPS.length}
      </p>
      <p className="tutorial__title">{current.title}</p>
      <p>{current.text}</p>
      <ol className="tutorial__dots" aria-hidden="true">
        {STEPS.map((s, i) => (
          <li key={s.title} className={i < step ? 'is-done' : i === step ? 'is-current' : ''} />
        ))}
      </ol>
      <button
        type="button"
        className="tutorial__skip"
        onClick={() => setSetting('tutorialDone', true)}
      >
        Passer
      </button>
    </div>
  )
}
