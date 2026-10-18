import { useEffect, useRef } from 'react'
import { useGameStore, type Quality } from '../state/useGameStore'
import { useEscape } from './escapeStack'
import { AvatarPicker } from './LaunchMenu'

const TEXT_SIZES: Array<[number, string]> = [
  [1, 'Normale'],
  [1.15, 'Grande'],
  [1.3, 'Très grande'],
]

const QUALITIES: Array<[Quality, string]> = [
  ['high', 'Élevée'],
  ['low', 'Basse (ordinateurs modestes)'],
]

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const settings = useGameStore((s) => s.settings)
  const setSetting = useGameStore((s) => s.setSetting)
  const resetProgress = useGameStore((s) => s.resetProgress)
  const openMenu = useGameStore((s) => s.openMenu)
  const panel = useRef<HTMLDivElement>(null)
  useEscape(onClose)

  useEffect(() => {
    panel.current?.querySelector<HTMLElement>('input, button')?.focus()
  }, [])

  return (
    <div id="settings-panel" ref={panel} className="panel" role="dialog" aria-label="Réglages">
      <h2>Réglages</h2>

      <label className="field">
        <input
          type="checkbox"
          checked={settings.clickToMove}
          onChange={(e) => setSetting('clickToMove', e.target.checked)}
        />
        Se déplacer en cliquant au sol
      </label>

      <label className="field">
        <input
          type="checkbox"
          checked={settings.reducedMotion}
          onChange={(e) => setSetting('reducedMotion', e.target.checked)}
        />
        Réduire les mouvements (transitions instantanées)
      </label>

      <label className="field">
        <input
          type="checkbox"
          checked={settings.guidedPath}
          onChange={(e) => setSetting('guidedPath', e.target.checked)}
        />
        Parcours guidé (ligne lumineuse au sol)
      </label>

      <label className="field">
        <input
          type="checkbox"
          checked={settings.minimap !== 'hidden'}
          onChange={(e) => setSetting('minimap', e.target.checked ? 'small' : 'hidden')}
        />
        Afficher la carte de l'étage
      </label>

      <fieldset className="field-group">
        <legend>Son d'ambiance</legend>
        <label className="field field--range">
          Volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.volume}
            onChange={(e) => setSetting('volume', Number(e.target.value))}
            aria-valuetext={`${Math.round(settings.volume * 100)} %`}
          />
        </label>
        <label className="field">
          <input
            type="checkbox"
            checked={settings.muted}
            onChange={(e) => setSetting('muted', e.target.checked)}
          />
          Couper le son
        </label>
      </fieldset>

      <AvatarPicker />

      <fieldset className="field-group">
        <legend>Taille du texte</legend>
        {TEXT_SIZES.map(([value, label]) => (
          <label key={value} className="field">
            <input
              type="radio"
              name="text-size"
              checked={settings.textScale === value}
              onChange={() => setSetting('textScale', value)}
            />
            {label}
          </label>
        ))}
      </fieldset>

      <fieldset className="field-group">
        <legend>Qualité graphique</legend>
        {QUALITIES.map(([value, label]) => (
          <label key={value} className="field">
            <input
              type="radio"
              name="quality"
              checked={settings.quality === value}
              onChange={() => setSetting('quality', value)}
            />
            {label}
          </label>
        ))}
      </fieldset>

      <div className="panel__actions">
        <button type="button" className="button button--ghost" onClick={resetProgress}>
          Recommencer la visite
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => {
            onClose()
            openMenu()
          }}
        >
          Menu
        </button>
        <button type="button" className="button" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  )
}
