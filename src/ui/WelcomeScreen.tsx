import { company, pathStations } from '../content/loader'
import { useGameStore, type AvatarId } from '../state/useGameStore'
import { Dialog } from './Dialog'

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

/** Écran d'accueil, au premier lancement (et depuis les Réglages). */
export function WelcomeScreen() {
  const welcomed = useGameStore((s) => s.settings.welcomed)
  const setSetting = useGameStore((s) => s.setSetting)
  if (welcomed) return null
  const start = () => setSetting('welcomed', true)

  return (
    <Dialog title={`Bienvenue chez ${company.name}`} onClose={start} className="welcome">
      <p className="welcome__lead">
        Visitez l'étage d'une entreprise qui fabrique des logiciels, et suivez une fonctionnalité de
        l'application <strong>Pocket Santé</strong> : « {company.feature.title} »
      </p>
      <p>
        De la plainte d'un patient jusqu'à la mise en ligne, {pathStations.length} métiers la font
        avancer. À chaque poste, regardez l'écran : des pastilles expliquent ce que vous voyez.
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
      <button type="button" className="button welcome__start" onClick={start} data-autofocus>
        Commencer la visite
      </button>
    </Dialog>
  )
}
