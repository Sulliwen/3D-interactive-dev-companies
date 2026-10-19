import { useEffect, useMemo, useState } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { StatTile } from '../common/charts'
import type { ScreenComponentProps } from '../types'
import { crashReportsPropsSchema } from './schema'
import './crash-reports.css'

const CHART_W = 900
const CHART_H = 116
const PAD = { l: 30, r: 8, t: 18, b: 16 }

/**
 * Rapports de plantage fictifs (« Vigie ») : chaque plantage chez un joueur envoie un
 * rapport ; on les regroupe par signature pour trouver la cause commune, puis on suit
 * l'effet du correctif.
 */
export function CrashReportsScreen({ toolName, props: rawProps }: ScreenComponentProps) {
  const props = useMemo(() => crashReportsPropsSchema.parse(rawProps), [rawProps])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  const [selected, setSelected] = useState(props.open.group)

  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const { buckets, markers } = props.timeline
  const max = Math.max(...buckets.map((b) => b.value), 1)
  const yMax = Math.ceil((max * 1.15) / 10) * 10
  const w = CHART_W - PAD.l - PAD.r
  const h = CHART_H - PAD.t - PAD.b
  const band = w / buckets.length
  const y = (v: number) => PAD.t + h - (v / yMax) * h
  const total = props.groups.reduce((s, g) => s + g.count, 0)
  const group = props.groups.find((g) => g.id === selected)
  const isOpen = selected === props.open.group

  return (
    <AppWindow
      toolName={toolName}
      title={props.title}
      titleRight={<span className="cr__scope">{props.scope}</span>}
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
      <div className="cr">
        <Zone id="tiles" className="cr__tiles">
          {props.tiles.map((t) => (
            <StatTile
              key={t.label}
              label={t.label}
              value={t.value}
              detail={t.detail}
              status={t.status}
            />
          ))}
        </Zone>

        <Zone id="timeline" className="cr__panel">
          <p className="cr__panel-title">{props.timeline.title}</p>
          <svg width={CHART_W} height={CHART_H} role="img" aria-label={props.timeline.title}>
            {[0, yMax / 2, yMax].map((t) => (
              <g key={t}>
                <line className="cr__grid" x1={PAD.l} x2={CHART_W - PAD.r} y1={y(t)} y2={y(t)} />
                <text className="cr__tick" x={PAD.l - 4} y={y(t) + 3} textAnchor="end">
                  {t}
                </text>
              </g>
            ))}
            {buckets.map((b, i) => (
              <g key={b.label}>
                <rect
                  className="cr__bar"
                  x={PAD.l + i * band + 1}
                  y={y(b.value)}
                  width={Math.max(1, band - 2)}
                  height={PAD.t + h - y(b.value)}
                />
                {i % 3 === 0 && (
                  <text
                    className="cr__tick"
                    x={PAD.l + i * band + band / 2}
                    y={CHART_H - 3}
                    textAnchor="middle"
                  >
                    {b.label}
                  </text>
                )}
              </g>
            ))}
            {markers.map((m) => {
              const x = PAD.l + m.at * band + band / 2
              return (
                <g key={m.label}>
                  <line className="cr__marker" x1={x} x2={x} y1={PAD.t - 6} y2={PAD.t + h} />
                  <text className="cr__marker-label" x={x + 4} y={PAD.t - 7}>
                    {m.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </Zone>

        <div className="cr__bottom">
          <Zone id="groups" className="cr__panel">
            <p className="cr__panel-title">
              Regroupés par signature · {total} rapport{total > 1 ? 's' : ''}
            </p>
            <ul className="cr__groups">
              {props.groups.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    className={`cr__group ${selected === g.id ? 'is-selected' : ''}`}
                    tabIndex={live ? 0 : -1}
                    onClick={() => setSelected(g.id)}
                    aria-pressed={selected === g.id}
                  >
                    <span
                      className={`cr__dot cr__dot--${g.status ?? 'warning'}`}
                      aria-hidden="true"
                    />
                    <span className="cr__sig">{g.signature}</span>
                    <span className="cr__count">
                      {g.count} <small>{g.share}</small>
                    </span>
                    <span className="cr__where">{g.where}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Zone>

          <Zone id="stack" className="cr__panel cr__stack">
            <p className="cr__panel-title">Pile d'appels · {group?.signature}</p>
            {isOpen ? (
              <>
                <pre className="cr__frames">
                  {props.open.frames.map((f, i) => (
                    <span key={i} className={i === 0 ? 'is-top' : ''}>
                      {`#${i} ${f}`}
                      {'\n'}
                    </span>
                  ))}
                </pre>
                <dl className="cr__context">
                  {props.open.context.map((c) => (
                    <div key={c.label}>
                      <dt>{c.label}</dt>
                      <dd>{c.value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <p className="cr__muted">
                {group?.count} rapport{(group?.count ?? 0) > 1 ? 's' : ''} · {group?.where}. Pas
                encore analysé ce soir : priorité au groupe principal.
              </p>
            )}
          </Zone>

          <Zone id="fix" className="cr__panel cr__fix">
            <p className="cr__panel-title">{props.fix.title}</p>
            <ol className="cr__steps">
              {props.fix.steps.map((s) => (
                <li key={s.time}>
                  <span className="cr__time">{s.time}</span>
                  <span>{s.text}</span>
                </li>
              ))}
            </ol>
            <p className="cr__rate">
              Taux de plantage <s>{props.fix.before}</s> → <strong>{props.fix.after}</strong>
            </p>
          </Zone>
        </div>
      </div>
    </AppWindow>
  )
}
