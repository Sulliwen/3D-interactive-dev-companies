import { useState } from 'react'
import { getVisit, type VisitRef } from '../content/loader'
import { visitedCount } from '../state/progress'
import { useGameStore, type AvatarId } from '../state/useGameStore'
import { useProgress, useVisit } from '../state/visit'
import { Dialog } from './Dialog'
import { VisitPicker } from './VisitPicker'

const AVATARS: Array<{ id: AvatarId; label: string }> = [
  { id: 'visitor_a', label: 'Silhouette 1' },
  { id: 'visitor_b', label: 'Silhouette 2' },
  { id: 'visitor_c', label: 'Silhouette 3' },
]

/** Choix de l'avatar (miniatures produites par `npm run art:characters`). */
export function AvatarPicker() {
  const avatar = useGameStore((s) => s.settings.avatar)
  const setSetting = useGameStore((s) => s.setSetting)
  return (
    <fieldset className="avatar-picker">
      <legend>Votre avatar (badge « visiteur »)</legend>
      {AVATARS.map((a) => (
        <label key={a.id} className={avatar === a.id ? 'is-selected' : ''}>
          <input
            type="radio"
            name="avatar"
            checked={avatar === a.id}
            onChange={() => setSetting('avatar', a.id)}
          />
          <img src={`${import.meta.env.BASE_URL}textures/avatars/${a.id}.jpg`} alt="" />
          <span>{a.label}</span>
        </label>
      ))}
    </fieldset>
  )
}

function ReducedMotionOption() {
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion)
  const setSetting = useGameStore((s) => s.setSetting)
  return (
    <label className="field welcome__motion">
      <input
        type="checkbox"
        checked={reducedMotion}
        onChange={(e) => setSetting('reducedMotion', e.target.checked)}
      />
      Réduire les mouvements de caméra (transitions instantanées, conseillé si vous êtes sensible au
      mal des transports)
    </label>
  )
}

/**
 * Menu de lancement, à chaque ouverture : reprendre la visite en cours, ou choisir une
 * structure puis un type de développement. « Lancer » ouvre la présentation du scénario.
 */
export function LaunchMenu() {
  const menu = useGameStore((s) => s.menu)
  const current = useGameStore((s) => s.visit)
  const openMenu = useGameStore((s) => s.openMenu)
  const closeMenu = useGameStore((s) => s.closeMenu)
  const launchVisit = useGameStore((s) => s.launchVisit)
  const progress = useProgress()
  const visit = useVisit()
  const [pending, setPending] = useState<VisitRef | null>(null)
  if (menu === null) return null

  const launch = (ref: VisitRef) => {
    setPending(null)
    launchVisit(ref)
  }

  if (pending) {
    const { structure, scenario, pathStations } = getVisit(pending)
    return (
      <Dialog
        title={`Bienvenue chez ${structure.name}`}
        onClose={() => setPending(null)}
        className="welcome"
        footer={
          <div className="welcome__actions">
            <button type="button" className="button button--ghost" onClick={() => setPending(null)}>
              ← Changer de visite
            </button>
            <button
              type="button"
              className="button welcome__start"
              onClick={() => launch(pending)}
              data-autofocus
            >
              Lancer la visite
            </button>
          </div>
        }
      >
        <p className="picker__kind">
          {structure.kind} · {scenario.kind}
        </p>
        <p className="welcome__lead">
          <strong>{scenario.title}</strong>
        </p>
        <p>
          {scenario.summary} Une courte présentation vous montre d'abord les {pathStations.length}{' '}
          étapes, puis c'est à vous : à chaque poste, regardez l'écran, des pastilles expliquent ce
          que vous voyez.
        </p>
        <AvatarPicker />
        <ReducedMotionOption />
        <ul className="welcome__keys">
          <li>
            <kbd>Z Q S D</kbd> / <kbd>W A S D</kbd> ou les flèches pour marcher, ou cliquez au sol.
          </li>
          <li>Glissez la souris pour regarder autour de vous.</li>
          <li>
            Près d'un poste, <kbd>E</kbd> pour regarder l'écran, <kbd>Échap</kbd> pour revenir.
          </li>
        </ul>
      </Dialog>
    )
  }

  if (menu === 'home' && current) {
    const seen = visitedCount(
      progress,
      visit.pathStations.map((s) => s.id),
    )
    return (
      <Dialog
        title="Dev Factory"
        onClose={closeMenu}
        className="welcome"
        footer={
          <div className="welcome__actions">
            <button type="button" className="button button--ghost" onClick={() => openMenu('pick')}>
              Choisir une autre visite
            </button>
            <span className="menu__group">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => launch(current)}
              >
                Revoir la présentation
              </button>
              <button
                type="button"
                className="button welcome__start"
                onClick={closeMenu}
                data-autofocus
              >
                Reprendre la visite
              </button>
            </span>
          </div>
        }
      >
        <p className="welcome__lead">
          Visitez les locaux d'une équipe qui fabrique des logiciels, et suivez un travail d'un
          poste à l'autre pour comprendre qui fait quoi.
        </p>
        <section className="menu__current" aria-label="Visite en cours">
          <p className="picker__kind">
            {visit.structure.name} · {visit.scenario.kind}
          </p>
          <p className="picker__title">{visit.scenario.title}</p>
          <p className="picker__meta">
            {seen} étape{seen > 1 ? 's' : ''} vue{seen > 1 ? 's' : ''} sur{' '}
            {visit.pathStations.length}
          </p>
        </section>
      </Dialog>
    )
  }

  return (
    <Dialog
      title="Bienvenue dans la Dev Factory"
      onClose={current ? () => openMenu('home') : undefined}
      className="welcome welcome--picker"
    >
      <p className="welcome__lead">
        Visitez les locaux d'une équipe qui fabrique des logiciels, et suivez un travail d'un poste
        à l'autre pour comprendre qui fait quoi.
      </p>
      <VisitPicker current={current} onChoose={setPending} />
    </Dialog>
  )
}
