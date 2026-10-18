import { useEffect, useMemo, useState } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { StatTile, StatusBadge } from '../common/charts'
import type { ScreenComponentProps } from '../types'
import { playtestLabPropsSchema, type PlaytestLabProps } from './schema'
import './playtest-lab.css'

const MARKER = {
  lost: { label: 'Perdu', symbol: '?' },
  death: { label: 'Chute', symbol: '✕' },
  stop: { label: 'Arrêt', symbol: '‖' },
} as const

/** « Labo de jeu » : résultats d'un playtest (carte de chaleur, entonnoir, citations). */
export function PlaytestLabScreen({ toolName, props: raw }: ScreenComponentProps) {
  const props = useMemo(() => playtestLabPropsSchema.parse(raw), [raw])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  const [index, setIndex] = useState(0)
  // Toutes les zones restent visibles, quel que soit l'onglet.
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const session = props.sessions[live ? index : 0]!
  const tab = live ? 0 : -1

  return (
    <AppWindow
      toolName={toolName}
      title={props.study}
      titleRight={
        props.sessions.length > 1 && (
          <span className="pl__tabs" role="group" aria-label="Session de playtest">
            {props.sessions.map((s, i) => (
              <button
                key={s.label}
                type="button"
                tabIndex={tab}
                aria-pressed={(live ? index : 0) === i}
                onClick={() => setIndex(i)}
              >
                {s.label}
              </button>
            ))}
          </span>
        )
      }
      status={
        <>
          <span>
            {session.label} · {session.detail}
          </span>
          <span style={{ marginLeft: 'auto' }}>{props.status}</span>
        </>
      }
    >
      <div className="pl">
        <Zone id="heatmap" className="pl__panel pl__map">
          <p className="pl__heading">Carte de chaleur · où les joueurs passent leur temps</p>
          <LevelMap map={props.map} session={session} />
          <p className="pl__legend">
            <span>
              <i className="pl__swatch" /> temps passé
            </span>
            {(['lost', 'death', 'stop'] as const).map((k) => (
              <span key={k}>
                <b className={`pl__mk pl__mk--${k}`}>{MARKER[k].symbol}</b> {MARKER[k].label}
              </span>
            ))}
          </p>
        </Zone>

        <div className="pl__right">
          <Zone id="stats" className="pl__stats">
            {session.stats.map((s) => (
              <StatTile
                key={s.label}
                label={s.label}
                value={s.value}
                detail={s.detail}
                status={s.status}
              />
            ))}
          </Zone>

          <Zone id="funnel" className="pl__panel pl__funnel">
            <p className="pl__heading">Arrivés sans aide, étape par étape</p>
            <Funnel funnel={session.funnel} />
          </Zone>

          <Zone id="quotes" className="pl__panel pl__quotes">
            <p className="pl__heading">Ce qu'ils disent</p>
            {props.quotes.map((q) => (
              <p key={q.text} className="pl__quote">
                « {q.text} » <span>{q.who}</span>
              </p>
            ))}
          </Zone>

          <Zone id="fix" className="pl__panel pl__fix">
            <p className="pl__heading">Correctif décidé · {props.fix.by}</p>
            <p className="pl__fix-title">{props.fix.title}</p>
            <p className="pl__fix-text">{props.fix.text}</p>
            <p className="pl__measure">
              <span>{props.fix.measure.label}</span>
              <StatusBadge status="critical">{props.fix.measure.before}</StatusBadge>
              <span aria-hidden="true">→</span>
              <StatusBadge status="good">{props.fix.measure.after}</StatusBadge>
            </p>
          </Zone>
        </div>
      </div>
    </AppWindow>
  )
}

function LevelMap({
  map,
  session,
}: {
  map: PlaytestLabProps['map']
  session: PlaytestLabProps['sessions'][number]
}) {
  const path = map.path.map(([x, y]) => `${x},${y}`).join(' ')
  const lost = session.markers.reduce((n, m) => n + (m.kind === 'lost' ? m.count : 0), 0)
  return (
    <svg
      className="pl__svg"
      viewBox="0 0 100 62"
      role="img"
      aria-label={`Plan du niveau : ${map.places.map((p) => p.label).join(', ')}. ${lost} joueurs perdus.`}
    >
      <defs>
        <radialGradient id="pl-heat">
          <stop offset="0" stopColor="#ffd34d" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#ec835a" stopOpacity="0.6" />
          <stop offset="1" stopColor="#d03b3b" stopOpacity="0" />
        </radialGradient>
        <pattern id="pl-grid" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M5 0H0V5" fill="none" stroke="#263046" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect width="100" height="62" fill="#141a26" />
      <rect width="100" height="62" fill="url(#pl-grid)" />
      <polyline className="pl__path" points={path} />
      {session.heat.map((h, i) => (
        <circle
          key={i}
          cx={h.at[0]}
          cy={h.at[1]}
          r={h.r}
          fill="url(#pl-heat)"
          opacity={0.25 + h.v * 0.75}
        />
      ))}
      <circle className="pl__focus" cx={map.focus.at[0]} cy={map.focus.at[1]} r={map.focus.r} />
      <text
        className="pl__focus-label"
        x={map.focus.at[0] + map.focus.r * 0.6}
        y={map.focus.at[1] - map.focus.r - 1.2}
        textAnchor="end"
      >
        {map.focus.label}
      </text>
      {map.places.map((p) => (
        <g key={p.label} transform={`translate(${p.at[0]} ${p.at[1]})`}>
          <circle className="pl__place" r="1.1" />
          <text
            className="pl__place-label"
            y="3.6"
            textAnchor={p.at[0] > 85 ? 'end' : p.at[0] < 12 ? 'start' : 'middle'}
          >
            {p.label}
          </text>
        </g>
      ))}
      {session.markers.map((m, i) => (
        <g key={i} transform={`translate(${m.at[0]} ${m.at[1]})`}>
          <circle className={`pl__marker pl__marker--${m.kind}`} r="2.1" />
          <text className="pl__marker-text" y="0.9" textAnchor="middle">
            {m.count}
          </text>
        </g>
      ))}
    </svg>
  )
}

function Funnel({ funnel }: { funnel: PlaytestLabProps['sessions'][number]['funnel'] }) {
  const max = Math.max(...funnel.map((f) => f.count), 1)
  return (
    <ol className="pl__steps">
      {funnel.map((f, i) => {
        const drop = i > 0 && f.count < funnel[i - 1]!.count
        return (
          <li key={f.label} className={drop ? 'is-drop' : ''}>
            <span className="pl__step-label">{f.label}</span>
            <span className="pl__bar">
              <span style={{ width: `${(f.count / max) * 100}%` }} />
            </span>
            <span className="pl__count">
              {f.count}/{max}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
