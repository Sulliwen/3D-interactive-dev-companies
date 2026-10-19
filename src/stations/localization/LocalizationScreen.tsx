import { useEffect, useMemo, useState } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { StatusBadge } from '../common/charts'
import type { ScreenComponentProps } from '../types'
import { localizationPropsSchema } from './schema'
import './localization.css'

const fmt = (n: number) => n.toLocaleString('fr-FR')

/** Dépassement d'une traduction par rapport à la place disponible, en % (0 si elle tient). */
const overflow = (text: string, limit: number) =>
  Math.max(0, Math.round(((text.length - limit) / limit) * 100))

/**
 * Outil de traduction fictif : langues, table des textes avec leur longueur maximale,
 * aperçu de la bulle qui déborde, relecture native, adaptation de l'humour.
 */
export function LocalizationScreen({ toolName, props: raw }: ScreenComponentProps) {
  const p = useMemo(() => localizationPropsSchema.parse(raw), [raw])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  const [fixed, setFixed] = useState(false)
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const row = p.table.rows.find((r) => r.id === p.bubble.rowId)!
  const shown = fixed ? p.bubble.fix : row.target
  const over = overflow(shown, row.limit)

  return (
    <AppWindow
      toolName={toolName}
      title={p.file}
      titleRight={
        <span>
          {fmt(p.totals.words)} mots · {fmt(p.totals.strings)} textes
        </span>
      }
      status={<span>{p.footer}</span>}
    >
      <div className="lz">
        <div className="lz__left">
          <Zone id="languages" className="lz__panel">
            <p className="lz__heading">Langues · {p.languages.length}</p>
            <ul className="lz__langs">
              {p.languages.map((l) => (
                <li key={l.code}>
                  <span className="lz__code">{l.code}</span>
                  <span className="lz__lang">
                    <b>{l.name}</b>
                    <em>{l.review}</em>
                  </span>
                  {l.source ? (
                    <span className="lz__src">source</span>
                  ) : l.issues > 0 ? (
                    <StatusBadge status="warning">{l.issues}</StatusBadge>
                  ) : (
                    <span className="lz__pct">{l.progress} %</span>
                  )}
                  <span className="lz__bar" aria-hidden="true">
                    <i style={{ width: `${l.progress}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </Zone>

          <Zone id="review" className="lz__panel">
            <p className="lz__heading">Tests par des joueurs natifs</p>
            {p.review.map((r) => (
              <div key={r.lang} className="lz__review">
                <b>{r.lang}</b>
                <span>{r.who}</span>
                <span className="lz__ok">✓ {r.result}</span>
              </div>
            ))}
          </Zone>
        </div>

        <div className="lz__right">
          <Zone id="strings" className="lz__panel lz__strings">
            <p className="lz__heading">Textes · français → {p.table.target}</p>
            <table>
              <thead>
                <tr>
                  <th>Identifiant</th>
                  <th>Français</th>
                  <th>{p.table.target}</th>
                  <th>Long.</th>
                </tr>
              </thead>
              <tbody>
                {p.table.rows.map((r) => {
                  const o = overflow(r.target, r.limit)
                  return (
                    <tr key={r.id} className={o > 0 ? 'is-over' : ''}>
                      <td className="lz__id">{r.id}</td>
                      <td>{r.source}</td>
                      <td>{r.target}</td>
                      <td className="lz__len">
                        {r.target.length}/{r.limit}
                        {o > 0 && <b> +{o} %</b>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Zone>

          <div className="lz__bottom">
            <Zone id="bubble" className="lz__panel lz__preview">
              <p className="lz__heading">Aperçu dans le jeu · {row.id}</p>
              <div className="lz__scene">
                <div className="lz__bubble">
                  <span className="lz__speaker">{p.bubble.speaker}</span>
                  <p>
                    {shown.slice(0, row.limit)}
                    <mark>{shown.slice(row.limit)}</mark>
                  </p>
                </div>
              </div>
              <p className={`lz__verdict ${over > 0 ? 'is-over' : 'is-ok'}`}>
                {over > 0
                  ? `${shown.length} caractères pour ${row.limit} : +${over} %, la fin sort de la bulle`
                  : `${shown.length} caractères pour ${row.limit} : la réplique tient`}
                {live && (
                  <button type="button" className="lz__toggle" onClick={() => setFixed((f) => !f)}>
                    {fixed ? 'Revoir le texte livré' : 'Essayer la correction'}
                  </button>
                )}
              </p>
              <p className="lz__fix">
                <b>Correction :</b> « {p.bubble.fix} » · {p.bubble.fixNote}
              </p>
            </Zone>

            <Zone id="humour" className="lz__panel lz__humour">
              <p className="lz__heading">Adapter plutôt que traduire · {p.humour.lang}</p>
              <p className="lz__line">
                <span>Original</span>« {p.humour.source} »
              </p>
              <p className="lz__line is-literal">
                <span>Mot à mot</span>« {p.humour.literal} »
              </p>
              <p className="lz__line is-adapted">
                <span>Adapté</span>« {p.humour.adapted} »
              </p>
              <p className="lz__note">{p.humour.note}</p>
            </Zone>
          </div>
        </div>
      </div>
    </AppWindow>
  )
}
