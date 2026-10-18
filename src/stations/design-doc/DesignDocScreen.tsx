import { useEffect, useMemo } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import type { ScreenComponentProps } from '../types'
import { designDocPropsSchema } from './schema'
import './design-doc.css'

/**
 * « Carnet de jeu » : document de game design partagé (vision, spécification). Sommaire à
 * gauche, page au centre (piliers, sections, références, réglages), commentaires à droite.
 */
export function DesignDocScreen({ toolName, props: raw }: ScreenComponentProps) {
  const p = useMemo(() => designDocPropsSchema.parse(raw), [raw])
  const { revealZone, zoneRevealed } = useAnnotations()
  // Tout tient sur la page : rien à faire défiler pour une pastille.
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  return (
    <AppWindow
      toolName={toolName}
      title={p.document}
      status={
        <>
          <span>{p.status}</span>
          <span style={{ marginLeft: 'auto' }}>
            {p.author} · {p.updated}
          </span>
        </>
      }
    >
      <div className="dd">
        <Zone id="outline" className="dd__outline">
          <p className="dd__heading">{p.space}</p>
          <ul>
            {p.outline.map((o) => (
              <li key={o.title} className={o.active ? 'is-active' : ''}>
                {o.title}
              </li>
            ))}
          </ul>
        </Zone>

        <div className="dd__page">
          <p className="dd__title">{p.document}</p>
          {p.lead && <p className="dd__lead">{p.lead}</p>}

          {p.pillars && (
            <Zone id="pillars" className="dd__pillars">
              {p.pillars.map((pi, i) => (
                <div key={pi.title} className="dd__pillar">
                  <span className="dd__pillar-n">{i + 1}</span>
                  <p className="dd__pillar-title">{pi.title}</p>
                  <p className="dd__pillar-text">{pi.text}</p>
                </div>
              ))}
            </Zone>
          )}

          {p.sections.length > 0 && (
            <Zone id="sections" className="dd__sections">
              {p.sections.map((s) => (
                <section key={s.heading}>
                  <p className="dd__h2">{s.heading}</p>
                  {s.text && <p className="dd__text">{s.text}</p>}
                  {s.bullets && (
                    <ul className="dd__bullets">
                      {s.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </Zone>
          )}

          {p.tuning && (
            <Zone id="tuning" className="dd__tuning">
              <p className="dd__h2">
                {p.tuning.title}
                <span className="dd__source">{p.tuning.source}</span>
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Réglage</th>
                    <th>Valeur</th>
                    <th>Pourquoi</th>
                  </tr>
                </thead>
                <tbody>
                  {p.tuning.rows.map((r) => (
                    <tr key={r.param} className={r.before ? 'is-changed' : ''}>
                      <td>{r.param}</td>
                      <td className="dd__value">
                        {r.before && <s>{r.before}</s>}
                        <strong>{r.value}</strong>
                      </td>
                      <td className="dd__note">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Zone>
          )}

          {p.references && (
            <Zone id="references" className="dd__refs">
              <p className="dd__h2">Références</p>
              <div className="dd__ref-list">
                {p.references.map((r) => (
                  <div key={r.title} className="dd__ref">
                    <span className="dd__ref-kind">{r.kind}</span>
                    <p className="dd__ref-title">{r.title}</p>
                    <p className="dd__ref-note">{r.note}</p>
                  </div>
                ))}
              </div>
            </Zone>
          )}
        </div>

        {p.comments.length > 0 && (
          <Zone id="comments" className="dd__comments">
            <p className="dd__heading">Commentaires</p>
            {p.comments.map((c) => (
              <div key={c.text} className={`dd__comment ${c.resolved ? 'is-resolved' : ''}`}>
                <p className="dd__who">
                  <span className="dd__avatar" aria-hidden="true">
                    {c.author.charAt(0)}
                  </span>
                  {c.author}
                  {c.resolved && <span className="dd__resolved">Résolu</span>}
                </p>
                <p>{c.text}</p>
                {c.reply && (
                  <div className="dd__reply">
                    <p className="dd__who">
                      <span className="dd__avatar" aria-hidden="true">
                        {c.reply.author.charAt(0)}
                      </span>
                      {c.reply.author}
                    </p>
                    <p>{c.reply.text}</p>
                  </div>
                )}
              </div>
            ))}
          </Zone>
        )}
      </div>
    </AppWindow>
  )
}
