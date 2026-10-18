import { useState } from 'react'

/**
 * Graphique d'avancement (burndown) : points restants jour après jour, face à la
 * ligne idéale. Un seul axe (des points). La série réelle s'arrête au dernier jour
 * écoulé ; un repère marque aujourd'hui. Mêmes classes CSS que les graphiques communs.
 */
export function Burndown({
  labels,
  actual,
  total,
  todayIndex,
  width = 360,
  height = 170,
}: {
  labels: string[]
  actual: number[]
  total: number
  todayIndex: number
  width?: number
  height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const pad = { l: 28, r: 10, t: 10, b: 20 }
  const w = width - pad.l - pad.r
  const h = height - pad.t - pad.b
  const last = labels.length - 1
  const ideal = labels.map((_, i) => total * (1 - i / last))
  const x = (i: number) => pad.l + (i / last) * w
  const y = (v: number) => pad.t + h - (v / total) * h
  const ticks = [0, Math.round(total / 2), total]

  return (
    <div className="chart">
      <p className="chart__legend">
        <span>
          <i style={{ background: 'var(--series-1)' }} /> Points restants
        </span>
        <span>
          <i className="sb__legend-ideal" /> Rythme idéal
        </span>
      </p>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Burndown : ${actual[actual.length - 1] ?? total} points restants sur ${total}`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect()
          const scale = box.width / width || 1
          const i = Math.round((((e.clientX - box.left) / scale - pad.l) / w) * last)
          setHover(Math.max(0, Math.min(last, i)))
        }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} className="chart__grid" />
            <text x={pad.l - 6} y={y(t) + 3} className="chart__tick" textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        {labels.map((l, i) => (
          <text key={l + i} x={x(i)} y={height - 5} className="chart__tick" textAnchor="middle">
            {l}
          </text>
        ))}
        <line
          x1={x(todayIndex)}
          x2={x(todayIndex)}
          y1={pad.t}
          y2={pad.t + h}
          className="chart__marker"
        />
        <text x={x(todayIndex) - 4} y={pad.t + 9} className="chart__marker-label" textAnchor="end">
          aujourd'hui
        </text>
        <polyline
          fill="none"
          className="sb__ideal"
          points={ideal.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
        />
        <polyline
          fill="none"
          stroke="var(--series-1)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={actual.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
        />
        {actual.length > 0 && (
          <circle
            cx={x(actual.length - 1)}
            cy={y(actual[actual.length - 1]!)}
            r={4}
            fill="var(--series-1)"
            stroke="var(--surface)"
            strokeWidth={2}
          />
        )}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + h} className="chart__cross" />
            {actual[hover] !== undefined && (
              <circle
                cx={x(hover)}
                cy={y(actual[hover])}
                r={4}
                fill="var(--series-1)"
                stroke="var(--surface)"
                strokeWidth={2}
              />
            )}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="chart__tooltip"
          style={
            x(hover) > width * 0.6 ? { right: width - x(hover) + 10 } : { left: x(hover) + 10 }
          }
        >
          <strong>{labels[hover]}</strong>
          <span>
            Restant :{' '}
            {actual[hover] !== undefined ? `${actual[hover]} points` : 'pas encore mesuré'}
          </span>
          <span>
            Idéal : {(Math.round(ideal[hover]! * 10) / 10).toLocaleString('fr-FR')} points
          </span>
        </div>
      )}
    </div>
  )
}
