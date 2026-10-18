import { useEffect, useMemo, useState } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import type { ScreenComponentProps } from '../types'
import { roadmapPropsSchema, type RoadmapProps } from './schema'
import './roadmap.css'

const SLOT = { 'pocket-sante': 1, facturo: 2, mutuelle: 3, tournee: 4 } as const

/** « Lumen Roadmap » : objectif du trimestre, feuille de route, priorisation impact / effort. */
export function RoadmapScreen({ toolName, props: raw }: ScreenComponentProps) {
  const props = useMemo(() => roadmapPropsSchema.parse(raw), [raw])
  const { revealZone, zoneRevealed } = useAnnotations()
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  return (
    <AppWindow
      toolName={toolName}
      title={props.view}
      status={
        <>
          <span>{props.validated}</span>
          <span style={{ marginLeft: 'auto' }}>{props.review}</span>
        </>
      }
    >
      <div className="rm">
        <Zone id="okr" className="rm__okr">
          <span className="rm__okr-tag">OKR du trimestre</span>
          <p className="rm__objective">{props.okr.objective}</p>
          <ul className="rm__krs">
            {props.okr.keyResults.map((kr) => (
              <li key={kr}>{kr}</li>
            ))}
          </ul>
        </Zone>

        <div className="rm__main">
          <Zone id="timeline" className="rm__panel rm__timeline">
            <p className="rm__heading">Feuille de route</p>
            <Timeline months={props.months} lanes={props.lanes} />
          </Zone>
          <Zone id="matrix" className="rm__panel rm__matrix">
            <p className="rm__heading">Priorisation · impact / effort</p>
            <Matrix items={props.matrix} />
          </Zone>
        </div>

        <Zone id="why" className="rm__panel rm__why">
          <p className="rm__heading">Pourquoi maintenant ?</p>
          <ol>
            {props.why.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ol>
        </Zone>
      </div>
    </AppWindow>
  )
}

function Timeline({ months, lanes }: Pick<RoadmapProps, 'months' | 'lanes'>) {
  const cols = `90px repeat(${months.length}, 1fr)`
  return (
    <div className="rm__grid">
      <div className="rm__row rm__row--months" style={{ gridTemplateColumns: cols }}>
        <span />
        {months.map((m) => (
          <span key={m} className="rm__month">
            {m}
          </span>
        ))}
      </div>
      {lanes.map((lane) => (
        <div key={lane.project} className="rm__row" style={{ gridTemplateColumns: cols }}>
          <span className="rm__lane-name">
            <i style={{ background: `var(--series-${SLOT[lane.project]})` }} />
            {lane.name}
          </span>
          {lane.items.map((item) => (
            <span
              key={item.title}
              className={`rm__bar ${item.highlight ? 'rm__bar--highlight' : ''}`}
              style={{
                gridColumn: `${item.start + 2} / ${item.end + 3}`,
                borderLeftColor: `var(--series-${SLOT[lane.project]})`,
              }}
            >
              {item.title}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

const MW = 300
const MH = 236
const PAD = 22

function Matrix({ items }: { items: RoadmapProps['matrix'] }) {
  const { live } = useAnnotations()
  const initial = Math.max(
    0,
    items.findIndex((i) => i.highlight),
  )
  const [selected, setSelected] = useState(initial)
  const x = (effort: number) => PAD + effort * (MW - PAD * 2)
  const y = (impact: number) => MH - PAD - impact * (MH - PAD * 2)
  const current = items[selected]

  return (
    <div className="rm__matrix-body">
      <svg width={MW} height={MH} role="img" aria-label="Matrice impact / effort">
        <rect
          x={PAD}
          y={PAD}
          width={(MW - PAD * 2) / 2}
          height={(MH - PAD * 2) / 2}
          className="rm__quad rm__quad--best"
        />
        <line x1={MW / 2} x2={MW / 2} y1={PAD} y2={MH - PAD} className="rm__axis-mid" />
        <line x1={PAD} x2={MW - PAD} y1={MH / 2} y2={MH / 2} className="rm__axis-mid" />
        <rect x={PAD} y={PAD} width={MW - PAD * 2} height={MH - PAD * 2} className="rm__frame" />
        <text x={PAD + 4} y={PAD + 11} className="rm__quad-label">
          À faire en premier
        </text>
        <text x={MW / 2} y={MH - 6} className="rm__axis-label" textAnchor="middle">
          Effort →
        </text>
        <text
          x={9}
          y={MH / 2}
          className="rm__axis-label"
          textAnchor="middle"
          transform={`rotate(-90 9 ${MH / 2})`}
        >
          Impact →
        </text>
        {items.map((item, i) => (
          <g
            key={item.label}
            className="rm__point"
            tabIndex={live ? 0 : -1}
            role="button"
            aria-label={`${item.label} : ${item.note}`}
            onClick={() => setSelected(i)}
            onMouseEnter={() => setSelected(i)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelected(i)}
          >
            <circle cx={x(item.effort)} cy={y(item.impact)} r={12} fill="transparent" />
            <circle
              cx={x(item.effort)}
              cy={y(item.impact)}
              r={item.highlight ? 7 : 5}
              fill={item.highlight ? 'var(--lumen)' : 'var(--series-1)'}
              stroke={i === selected ? '#fff' : 'var(--surface-2)'}
              strokeWidth={2}
            />
            <text
              x={x(item.effort) + (item.effort > 0.7 ? -10 : 10)}
              y={y(item.impact) + 4}
              textAnchor={item.effort > 0.7 ? 'end' : 'start'}
              className={`rm__point-label ${item.highlight ? 'rm__point-label--highlight' : ''}`}
            >
              {item.label}
            </text>
          </g>
        ))}
      </svg>
      {current && (
        <p className="rm__note">
          <strong>{current.label}</strong> — {current.note}
        </p>
      )}
    </div>
  )
}
