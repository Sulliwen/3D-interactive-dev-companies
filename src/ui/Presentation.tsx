import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../state/useGameStore'
import { useVisit } from '../state/visit'
import { useEscape } from './escapeStack'
import { RichText } from './RichText'

/** Durée d'affichage de l'ouverture, puis de chaque poste (vol de la caméra compris), en ms. */
const OPENING_MS = 7500
const STEP_MS = 4500

/**
 * Présentation du scénario, au lancement d'une visite : un message qui le résume, puis la
 * caméra survole les postes du parcours, avec une légende brève. On peut la passer à tout
 * moment (Échap), avancer à son rythme (flèches) ou la mettre en pause pour lire (Espace).
 */
export function Presentation() {
  const tour = useGameStore((s) => s.tour)
  const setTour = useGameStore((s) => s.setTour)
  const showToast = useGameStore((s) => s.showToast)
  const { structure, scenario, pathStations } = useVisit()
  const active = tour !== null
  // Le survol attend que l'étage soit chargé (après un changement de structure).
  const ready = useGameStore((s) => s.worldReady === structure.world)
  const last = pathStations.length - 1
  const [paused, setPaused] = useState(false)
  // Temps déjà passé sur le plan affiché, pour reprendre là où la pause l'a arrêté.
  const elapsed = useRef(0)
  const duration = tour !== null && tour < 0 ? OPENING_MS : STEP_MS

  const end = () => {
    setPaused(false)
    setTour(null)
    showToast(`À vous : suivez la ligne orange jusqu'au poste ${pathStations[0]?.desk ?? 1}.`)
  }
  const go = (index: number) => (index > last ? end() : setTour(Math.max(-1, index)))
  useEscape(end, active)

  // Chaque nouveau plan repart de zéro.
  useEffect(() => {
    elapsed.current = 0
  }, [tour])

  // Avance automatique, suspendue pendant la pause.
  useEffect(() => {
    if (tour === null || paused || !ready) return
    const started = performance.now() - elapsed.current
    const id = window.setTimeout(
      () => (tour >= last ? end() : setTour(tour + 1)),
      duration - elapsed.current,
    )
    return () => {
      window.clearTimeout(id)
      elapsed.current = performance.now() - started
    }
    // `end` ne change qu'avec la visite, déjà suivie via `last`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour, last, setTour, paused, duration, ready])

  useEffect(() => {
    if (tour === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(tour + 1)
      else if (e.key === 'ArrowLeft') go(tour - 1)
      // Espace met en pause, même quand un bouton de la présentation a le focus.
      else if (e.key === ' ' && !e.repeat) setPaused((p) => !p)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })

  if (tour === null) return null
  const station = tour >= 0 ? pathStations[tour] : undefined

  return (
    <section
      className={`tour ${paused ? 'is-paused' : ''}`}
      aria-label="Présentation du scénario"
      aria-live="polite"
    >
      {station ? (
        <div key={station.id} className="tour__card">
          <p className="tour__kicker">
            Étape {station.step} sur {pathStations.length} · {station.title}
          </p>
          <p className="tour__title">
            {station.person.firstName} {station.person.lastName}
          </p>
          <p className="tour__text">
            <RichText text={station.featureStep} />
          </p>
        </div>
      ) : (
        <div key="ouverture" className="tour__card tour__card--opening">
          <p className="tour__kicker">
            {structure.name} · {scenario.kind}
          </p>
          <p className="tour__title">{scenario.title}</p>
          <p className="tour__text">{scenario.summary}</p>
          <p className="tour__hint">
            Survol des {pathStations.length} étapes du parcours, puis la visite est à vous.{' '}
            <kbd>Espace</kbd> pour mettre en pause, <kbd>←</kbd> <kbd>→</kbd> pour avancer à votre
            rythme.
          </p>
        </div>
      )}
      <span
        key={`barre-${tour}`}
        className="tour__timer"
        style={{
          animationDuration: `${duration}ms`,
          animationPlayState: paused || !ready ? 'paused' : 'running',
        }}
        aria-hidden="true"
      />
      <div className="tour__controls">
        <button
          type="button"
          className="button button--ghost"
          onClick={() => go(tour - 1)}
          disabled={tour < 0}
          aria-label="Étape précédente"
        >
          ‹
        </button>
        <button
          type="button"
          className="button button--ghost tour__pause"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          aria-label={paused ? 'Reprendre la présentation' : 'Mettre en pause'}
          title={paused ? 'Reprendre (Espace)' : 'Pause (Espace)'}
        >
          {paused ? '▶' : '❚❚'}
        </button>
        <ol className="tour__dots" aria-hidden="true">
          {[-1, ...pathStations.map((_, i) => i)].map((i) => (
            <li key={i} className={i < tour ? 'is-done' : i === tour ? 'is-current' : ''} />
          ))}
        </ol>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => go(tour + 1)}
          aria-label="Étape suivante"
        >
          ›
        </button>
        <button type="button" className="button tour__skip" onClick={end} data-autofocus>
          Passer la présentation <kbd>Échap</kbd>
        </button>
      </div>
    </section>
  )
}
