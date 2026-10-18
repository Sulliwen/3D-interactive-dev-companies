import { useState, type ReactNode } from 'react'
import './common.css'

/*
 * Petits graphiques SVG pour les tableaux de bord simulés (fond sombre).
 * Couleurs par rôle (variables CSS de `.screen`, palette validée sur #171c28) :
 *   --series-1 bleu, --series-2 orange, --series-3 vert d'eau (catégories, dans cet ordre) ;
 *   --status-good / --status-warning / --status-serious / --status-critical (états, toujours
 *   accompagnés d'une icône ou d'un libellé).
 * Survol : réticule + infobulle sur les courbes, infobulle par barre.
 */

export interface Series {
  id: string
  label: string
  values: number[]
  /** Rang de couleur catégorielle (1 à 3), fixe pour l'entité. */
  slot: 1 | 2 | 3
}

const fmtDefault = (v: number) => v.toLocaleString('fr-FR')

/** Courbes sur un seul axe vertical. Au-delà d'une série, une légende est affichée. */
export function LineChart({
  series,
  labels,
  width = 420,
  height = 180,
  format = fmtDefault,
  yMax,
  marker,
}: {
  series: Series[]
  labels: string[]
  width?: number
  height?: number
  format?: (v: number) => string
  yMax?: number
  /** Repère vertical (ex. « mise en ligne ») à l'index donné. */
  marker?: { index: number; label: string }
}) {
  const [hover, setHover] = useState<number | null>(null)
  const pad = { l: 34, r: 10, t: 10, b: 20 }
  const w = width - pad.l - pad.r
  const h = height - pad.t - pad.b
  const max = yMax ?? niceMax(Math.max(...series.flatMap((s) => s.values)))
  const x = (i: number) => pad.l + (labels.length <= 1 ? 0 : (i / (labels.length - 1)) * w)
  const y = (v: number) => pad.t + h - (v / max) * h
  const ticks = [0, max / 2, max]

  return (
    <div className="chart">
      {series.length > 1 && <Legend series={series} />}
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={series.map((s) => s.label).join(', ')}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect()
          const scale = box.width / width || 1
          const px = (e.clientX - box.left) / scale
          const i = Math.round(((px - pad.l) / w) * (labels.length - 1))
          setHover(Math.max(0, Math.min(labels.length - 1, i)))
        }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} className="chart__grid" />
            <text x={pad.l - 6} y={y(t) + 3} className="chart__tick" textAnchor="end">
              {format(t)}
            </text>
          </g>
        ))}
        {labels.map((l, i) =>
          i % Math.ceil(labels.length / 6) === 0 || i === labels.length - 1 ? (
            <text key={l + i} x={x(i)} y={height - 5} className="chart__tick" textAnchor="middle">
              {l}
            </text>
          ) : null,
        )}
        {marker && (
          <g>
            <line
              x1={x(marker.index)}
              x2={x(marker.index)}
              y1={pad.t}
              y2={pad.t + h}
              className="chart__marker"
            />
            <text x={x(marker.index) + 4} y={pad.t + 9} className="chart__marker-label">
              {marker.label}
            </text>
          </g>
        )}
        {series.map((s) => (
          <polyline
            key={s.id}
            fill="none"
            stroke={`var(--series-${s.slot})`}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
          />
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + h} className="chart__cross" />
            {series.map((s) => (
              <circle
                key={s.id}
                cx={x(hover)}
                cy={y(s.values[hover] ?? 0)}
                r={4}
                fill={`var(--series-${s.slot})`}
                stroke="var(--surface)"
                strokeWidth={2}
              />
            ))}
          </g>
        )}
      </svg>
      {hover !== null && (
        <Tooltip left={x(hover)} width={width}>
          <strong>{labels[hover]}</strong>
          {series.map((s) => (
            <span key={s.id}>
              <i style={{ background: `var(--series-${s.slot})` }} /> {s.label} :{' '}
              {format(s.values[hover] ?? 0)}
            </span>
          ))}
        </Tooltip>
      )}
    </div>
  )
}

/** Barres verticales d'une seule série ; `highlight` met une barre en avant (couleur 2). */
export function BarChart({
  bars,
  width = 420,
  height = 170,
  format = fmtDefault,
  label,
}: {
  bars: Array<{ label: string; value: number; highlight?: boolean }>
  width?: number
  height?: number
  format?: (v: number) => string
  label: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const pad = { l: 34, r: 6, t: 8, b: 20 }
  const w = width - pad.l - pad.r
  const h = height - pad.t - pad.b
  const max = niceMax(Math.max(...bars.map((b) => b.value)))
  const band = w / bars.length
  const barW = Math.min(28, band - 2)

  return (
    <div className="chart">
      <svg width={width} height={height} role="img" aria-label={label}>
        {[0, max / 2, max].map((t) => (
          <g key={t}>
            <line
              x1={pad.l}
              x2={width - pad.r}
              y1={pad.t + h - (t / max) * h}
              y2={pad.t + h - (t / max) * h}
              className="chart__grid"
            />
            <text
              x={pad.l - 6}
              y={pad.t + h - (t / max) * h + 3}
              className="chart__tick"
              textAnchor="end"
            >
              {format(t)}
            </text>
          </g>
        ))}
        {bars.map((b, i) => {
          const bh = (b.value / max) * h
          const cx = pad.l + band * i + band / 2
          return (
            <g key={b.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {/* Zone de survol plus large que la barre. */}
              <rect x={cx - band / 2} y={pad.t} width={band} height={h} fill="transparent" />
              <path
                d={roundedTop(cx - barW / 2, pad.t + h - bh, barW, bh, 4)}
                fill={b.highlight ? 'var(--series-2)' : 'var(--series-1)'}
                opacity={hover === null || hover === i ? 1 : 0.55}
              />
              <text x={cx} y={height - 5} className="chart__tick" textAnchor="middle">
                {b.label}
              </text>
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <Tooltip left={pad.l + band * hover + band / 2} width={width}>
          <strong>{bars[hover]!.label}</strong>
          <span>
            {label} : {format(bars[hover]!.value)}
          </span>
        </Tooltip>
      )}
    </div>
  )
}

/** Tuile « chiffre clé » : le nombre est le message, pas besoin de graphique. */
export function StatTile({
  label,
  value,
  detail,
  status,
}: {
  label: string
  value: string
  detail?: ReactNode
  status?: 'good' | 'warning' | 'serious' | 'critical'
}) {
  const icon = status ? STATUS_ICON[status] : null
  return (
    <div className="stat">
      <p className="stat__label">{label}</p>
      <p className="stat__value">{value}</p>
      {detail && (
        <p className={`stat__detail ${status ? `stat__detail--${status}` : ''}`}>
          {icon && <span aria-hidden="true">{icon} </span>}
          {detail}
        </p>
      )}
    </div>
  )
}

/** Pastille d'état : toujours icône + libellé, jamais la couleur seule. */
export function StatusBadge({
  status,
  children,
}: {
  status: 'good' | 'warning' | 'serious' | 'critical' | 'neutral'
  children: ReactNode
}) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      <span aria-hidden="true">{status === 'neutral' ? '•' : STATUS_ICON[status]}</span> {children}
    </span>
  )
}

const STATUS_ICON = { good: '✓', warning: '!', serious: '▲', critical: '✕' } as const

function Legend({ series }: { series: Series[] }) {
  return (
    <p className="chart__legend">
      {series.map((s) => (
        <span key={s.id}>
          <i style={{ background: `var(--series-${s.slot})` }} /> {s.label}
        </span>
      ))}
    </p>
  )
}

function Tooltip({ left, width, children }: { left: number; width: number; children: ReactNode }) {
  const flip = left > width * 0.6
  return (
    <div
      className="chart__tooltip"
      style={flip ? { right: width - left + 10 } : { left: left + 10 }}
    >
      {children}
    </div>
  )
}

function niceMax(v: number): number {
  if (v <= 0) return 1
  const exp = 10 ** Math.floor(Math.log10(v))
  const n = v / exp
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return nice * exp
}

function roundedTop(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, h, w / 2)
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`
}
