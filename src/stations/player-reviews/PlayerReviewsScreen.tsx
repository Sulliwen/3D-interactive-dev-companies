import { useEffect, useMemo } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import type { ScreenComponentProps } from '../types'
import { playerReviewsPropsSchema } from './schema'
import './player-reviews.css'

const pct = (v: number) => `${Math.round(v * 100)} %`

/**
 * Avis des joueurs et de la presse, le soir de la sortie : la note globale, les sujets
 * qui reviennent, quelques avis avec la réponse de l'équipe, et ce qu'on en retient.
 */
export function PlayerReviewsScreen({ toolName, props: rawProps }: ScreenComponentProps) {
  const props = useMemo(() => playerReviewsPropsSchema.parse(rawProps), [rawProps])
  const { revealZone, zoneRevealed } = useAnnotations()

  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const { summary, press } = props
  const total = summary.positive + summary.negative
  const maxMentions = Math.max(...props.themes.map((t) => t.mentions))

  return (
    <AppWindow
      toolName={toolName}
      title={props.title}
      titleRight={<span className="prv__period">{props.period}</span>}
      status={
        props.statusItems.length > 0 ? (
          <>
            {props.statusItems.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </>
        ) : undefined
      }
    >
      <div className="prv">
        <div className="prv__left">
          <Zone id="summary" className="prv__panel prv__summary">
            <p className="prv__panel-title">Avis des joueurs</p>
            <p className="prv__big">{summary.percent} %</p>
            <p className="prv__label">{summary.label}</p>
            <div
              className="prv__split"
              role="img"
              aria-label={`${summary.positive} avis positifs, ${summary.negative} négatifs`}
            >
              <span style={{ width: `${(summary.positive / Math.max(1, total)) * 100}%` }} />
            </div>
            <p className="prv__counts">
              <span>✓ {summary.positive.toLocaleString('fr-FR')} positifs</span>
              <span>✗ {summary.negative.toLocaleString('fr-FR')} négatifs</span>
            </p>
            <p className="prv__muted">{summary.detail}</p>
          </Zone>

          <Zone id="press" className="prv__panel prv__press">
            <p className="prv__panel-title">Presse · {press.source}</p>
            <p className="prv__press-score">
              <strong>{press.score}</strong>/100 <span>· {press.count} tests</span>
            </p>
            <ul className="prv__quotes">
              {press.quotes.map((q) => (
                <li key={q.outlet}>
                  <span className="prv__outlet">
                    {q.outlet} · {q.score}
                  </span>
                  « {q.text} »
                </li>
              ))}
            </ul>
          </Zone>
        </div>

        <div className="prv__middle">
          <Zone id="themes" className="prv__panel">
            <p className="prv__panel-title">Ce qui revient dans les avis</p>
            <ul className="prv__themes">
              {props.themes.map((t) => (
                <li key={t.label}>
                  <span className="prv__theme">{t.label}</span>
                  <span className="prv__mentions">{t.mentions} mentions</span>
                  <span
                    className="prv__bar"
                    style={{ width: `${(t.mentions / maxMentions) * 100}%` }}
                    aria-hidden="true"
                  >
                    <span className="prv__bar-pos" style={{ width: `${t.positive * 100}%` }} />
                  </span>
                  <span className={`prv__share ${t.positive < 0.5 ? 'is-negative' : ''}`}>
                    {pct(t.positive)} positifs
                  </span>
                  {t.note && <span className="prv__note">{t.note}</span>}
                </li>
              ))}
            </ul>
          </Zone>

          <Zone id="roadmap" className="prv__panel prv__roadmap">
            <p className="prv__panel-title">{props.roadmap.title}</p>
            <ul>
              {props.roadmap.items.map((it) => (
                <li key={it.text}>
                  <span className="prv__when">{it.when}</span>
                  {it.text}
                </li>
              ))}
            </ul>
          </Zone>
        </div>

        <Zone id="reviews" className="prv__panel prv__reviews">
          <p className="prv__panel-title">Derniers avis</p>
          {props.reviews.map((r) => (
            <article key={r.author} className="prv__review">
              <p className="prv__review-head">
                <span className={`prv__verdict ${r.recommended ? '' : 'is-negative'}`}>
                  {r.recommended ? '✓ Recommandé' : '✗ Non recommandé'}
                </span>
                <span className="prv__author">{r.author}</span>
                <span className="prv__muted">{r.hours}</span>
              </p>
              <p className="prv__review-text">{r.text}</p>
              {r.reply && (
                <p className="prv__reply">
                  <strong>{r.reply.author}</strong> {r.reply.text}
                </p>
              )}
            </article>
          ))}
        </Zone>
      </div>
    </AppWindow>
  )
}
