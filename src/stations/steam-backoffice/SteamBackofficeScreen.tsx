import { useEffect, useMemo, useState } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { StatusBadge } from '../common/charts'
import { Icon } from '../common/icons'
import type { ScreenComponentProps } from '../types'
import { steamBackofficePropsSchema, type SteamBackofficeProps } from './schema'
import './steam-backoffice.css'

const fmt = (n: number) => n.toLocaleString('fr-FR')

/**
 * Back-office fictif d'une boutique de jeux : listes de souhaits, état de la page, compte à
 * rebours, prix de lancement, embargo presse.
 */
export function SteamBackofficeScreen({ toolName, props: raw }: ScreenComponentProps) {
  const p = useMemo(() => steamBackofficePropsSchema.parse(raw), [raw])
  const { revealZone, zoneRevealed } = useAnnotations()
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const total = p.wishlists.added.reduce((a, b) => a + b, 0)
  const keys = p.press.keys.reduce((a, k) => a + k.count, 0)

  return (
    <AppWindow
      toolName={toolName}
      title={p.page}
      titleRight={<span>Rôle : partenaire · Ondine Publishing</span>}
      status={
        <>
          <span>{p.footer}</span>
          <span style={{ marginLeft: 'auto' }}>
            {fmt(total)} listes de souhaits · {fmt(keys)} clés envoyées
          </span>
        </>
      }
    >
      <div className="sbo">
        <Zone id="wishlists" className="sbo__panel sbo__wishlists">
          <div className="sbo__head">
            <p className="sbo__heading">Listes de souhaits</p>
            <p className="sbo__big">
              {fmt(total)}
              <span>
                {p.wishlists.goalLabel} : {fmt(p.wishlists.goal)} ·{' '}
                {total >= p.wishlists.goal ? '✓ dépassé' : 'pas encore atteint'}
              </span>
            </p>
          </div>
          <WishlistChart w={p.wishlists} />
        </Zone>

        <div className="sbo__side">
          <Zone id="countdown" className="sbo__panel sbo__countdown">
            <p className="sbo__heading">{p.countdown.label}</p>
            <p className="sbo__remaining">{p.countdown.remaining}</p>
            <p className="sbo__muted">{p.countdown.at}</p>
          </Zone>

          <Zone id="status" className="sbo__panel">
            <p className="sbo__heading">
              Page de la boutique · <StatusBadge status="good">{p.status.label}</StatusBadge>
            </p>
            <ul className="sbo__checks">
              {p.status.checks.map((c) => (
                <li key={c.label} className={c.done ? 'is-done' : ''}>
                  <span className="sbo__check" aria-hidden="true">
                    {c.done && <Icon name="check" size={10} />}
                  </span>
                  {c.label}
                </li>
              ))}
            </ul>
          </Zone>

          <Zone id="price" className="sbo__panel sbo__price">
            <p className="sbo__heading">Prix de lancement</p>
            <div className="sbo__price-row">
              <span className="sbo__discount">−{p.price.discount} %</span>
              <s>{p.price.base}</s>
              <b>{p.price.launch}</b>
            </div>
            <p className="sbo__muted">{p.price.until}</p>
          </Zone>

          <Zone id="press" className="sbo__panel">
            <p className="sbo__heading">
              Presse ·{' '}
              <StatusBadge status={p.press.lifted ? 'good' : 'warning'}>
                {p.press.embargo}
              </StatusBadge>
            </p>
            <ul className="sbo__keys">
              {p.press.keys.map((k) => (
                <li key={k.label}>
                  <span>{k.label}</span>
                  <b>{fmt(k.count)} clés</b>
                </li>
              ))}
            </ul>
            <p className="sbo__muted">{p.press.note}</p>
          </Zone>
        </div>
      </div>
    </AppWindow>
  )
}

/** Cumul des listes de souhaits (courbe), ajouts par mois (barres), objectif et pics. */
function WishlistChart({ w }: { w: SteamBackofficeProps['wishlists'] }) {
  const [hover, setHover] = useState<number | null>(null)
  const width = 560
  const height = 400
  const pad = { l: 44, r: 14, t: 16, b: 22 }
  const barsH = 88
  const lineH = height - pad.t - pad.b - barsH - 26
  const n = w.added.length
  const step = (width - pad.l - pad.r) / n
  const x = (i: number) => pad.l + step * (i + 0.5)
  const cumul = w.added.reduce<number[]>((acc, v) => [...acc, (acc.at(-1) ?? 0) + v], [])
  const max = Math.max(w.goal, cumul.at(-1) ?? 0) * 1.1
  const yLine = (v: number) => pad.t + lineH - (v / max) * lineH
  const barMax = Math.max(...w.added)
  const barTop = pad.t + lineH + 26
  const yBar = (v: number) => barTop + barsH - (v / barMax) * barsH
  const peaks = new Map(w.peaks.map((p) => [p.index, p.label]))

  return (
    <div className="sbo__chart">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Listes de souhaits cumulées, de ${w.months[0]} à ${w.months.at(-1)}`}
        onMouseLeave={() => setHover(null)}
      >
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1={pad.l}
              x2={width - pad.r}
              y1={yLine(max * t)}
              y2={yLine(max * t)}
              className="chart__grid"
            />
            <text x={pad.l - 6} y={yLine(max * t) + 3} className="chart__tick" textAnchor="end">
              {fmt(Math.round((max * t) / 1000))} k
            </text>
          </g>
        ))}
        <line
          x1={pad.l}
          x2={width - pad.r}
          y1={yLine(w.goal)}
          y2={yLine(w.goal)}
          className="sbo__goal"
        />
        <text x={pad.l + 4} y={yLine(w.goal) - 4} className="sbo__goal-label">
          {w.goalLabel} · {fmt(w.goal)}
        </text>
        <path
          d={`M${x(0)},${yLine(0)} ${cumul.map((v, i) => `L${x(i)},${yLine(v)}`).join(' ')} L${x(n - 1)},${yLine(0)} Z`}
          className="sbo__area"
        />
        <polyline
          points={cumul.map((v, i) => `${x(i)},${yLine(v)}`).join(' ')}
          className="sbo__line"
        />
        {w.peaks.map((pk, k) => {
          const v = cumul[pk.index] ?? 0
          const ly = yLine(v) - 14 - (k % 2) * 14
          const right = x(pk.index) > width * 0.62
          return (
            <g key={pk.index}>
              <circle cx={x(pk.index)} cy={yLine(v)} r={4} className="sbo__peak" />
              <line
                x1={x(pk.index)}
                x2={x(pk.index)}
                y1={yLine(v) - 4}
                y2={ly + 3}
                className="sbo__leader"
              />
              <text
                x={x(pk.index) + (right ? -4 : 4)}
                y={ly}
                textAnchor={right ? 'end' : 'start'}
                className="sbo__peak-label"
              >
                {k + 1}. {pk.label}
              </text>
            </g>
          )
        })}

        <text x={pad.l} y={barTop - 8} className="sbo__sub">
          Ajouts par mois
        </text>
        {w.added.map((v, i) => (
          <rect
            key={i}
            x={x(i) - step * 0.34}
            y={yBar(v)}
            width={step * 0.68}
            height={barTop + barsH - yBar(v)}
            rx={2}
            className={`sbo__bar ${peaks.has(i) ? 'is-peak' : ''} ${hover === i ? 'is-hover' : ''}`}
            onMouseEnter={() => setHover(i)}
          />
        ))}
        {w.months.map((m, i) => (
          <text key={m + i} x={x(i)} y={height - 6} className="chart__tick" textAnchor="middle">
            {m}
          </text>
        ))}
      </svg>
      {hover !== null && (
        <div
          className="chart__tooltip"
          style={
            x(hover) > width * 0.6 ? { right: width - x(hover) + 10 } : { left: x(hover) + 10 }
          }
        >
          <strong>{w.months[hover]}</strong>
          <span>+{fmt(w.added[hover] ?? 0)} ce mois-ci</span>
          <span>{fmt(cumul[hover] ?? 0)} au total</span>
          {peaks.get(hover) && <span>{peaks.get(hover)}</span>}
        </div>
      )}
    </div>
  )
}
