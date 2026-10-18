import { useEffect, useMemo, useState } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { StatTile } from '../common/charts'
import type { ScreenComponentProps } from '../types'
import { captureFrames, profilerPropsSchema } from './schema'
import './profiler.css'

const CHART_W = 900
const CHART_H = 178
const PAD = { l: 34, r: 8, t: 14, b: 16 }

const ms = (v: number) => `${v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ms`

/**
 * Profileur fictif : la durée de chaque image du jeu, comparée au budget (16,6 ms pour
 * 60 images par seconde). Un pic dépasse ? On regarde quel système a pris le temps.
 */
export function ProfilerScreen({ toolName, props: rawProps }: ScreenComponentProps) {
  const props = useMemo(() => profilerPropsSchema.parse(rawProps), [rawProps])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  const [view, setView] = useState(props.initial)

  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const capture = props[view]
  const frames = useMemo(() => captureFrames(capture), [capture])
  const budget = props.target.budgetMs
  const allMax = Math.max(
    ...captureFrames(props.before),
    ...captureFrames(props.after),
    budget * 1.3,
  )
  const yMax = Math.ceil(allMax / 5) * 5
  const w = CHART_W - PAD.l - PAD.r
  const h = CHART_H - PAD.t - PAD.b
  const band = w / frames.length
  const y = (v: number) => PAD.t + h - (v / yMax) * h
  const over = frames.filter((f) => f > budget).length
  const worst = Math.max(...frames)
  const barMax = Math.max(...props.breakdown.items.flatMap((i) => [i.before, i.after]))

  return (
    <AppWindow
      toolName={toolName}
      title={props.title}
      titleRight={
        <span className="pf__target">
          {props.target.name} · {props.target.detail}
        </span>
      }
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
      <div className="pf">
        <Zone id="tiles" className="pf__tiles">
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

        <Zone id="frames" className="pf__panel">
          <div className="pf__head">
            <p className="pf__panel-title">Durée de chaque image</p>
            <div className="pf__tabs" role="tablist" aria-label="Capture">
              {(['before', 'after'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={view === k}
                  tabIndex={live ? 0 : -1}
                  className={`pf__tab ${view === k ? 'is-active' : ''}`}
                  onClick={() => setView(k)}
                >
                  {props[k].label}
                </button>
              ))}
            </div>
            <span className="pf__summary">
              Pire image {ms(worst)} · {over} image{over > 1 ? 's' : ''} hors budget
            </span>
          </div>
          <svg
            width={CHART_W}
            height={CHART_H}
            role="img"
            aria-label={`Durée des images, ${capture.label}`}
          >
            {[0, budget, yMax].map((t) => (
              <text key={t} className="pf__tick" x={PAD.l - 4} y={y(t) + 3} textAnchor="end">
                {t.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}
              </text>
            ))}
            {frames.map((f, i) => (
              <rect
                key={i}
                className={`pf__bar ${f > budget ? 'is-over' : ''}`}
                x={PAD.l + i * band + 0.5}
                y={y(f)}
                width={Math.max(1, band - 1)}
                height={PAD.t + h - y(f)}
              />
            ))}
            <line
              className="pf__budget"
              x1={PAD.l}
              x2={CHART_W - PAD.r}
              y1={y(budget)}
              y2={y(budget)}
            />
            <text className="pf__budget-label" x={PAD.l + 6} y={y(budget) - 5}>
              Budget : {ms(budget)} par image ({Math.round(1000 / budget)} images par seconde)
            </text>
            {capture.spikes
              .filter((s) => s.label && s.at < frames.length)
              .map((s) => {
                const x = PAD.l + ((s.at + (s.to ?? s.at)) / 2) * band + band / 2
                return (
                  <text
                    key={s.at}
                    className="pf__spike-label"
                    x={x}
                    y={Math.max(PAD.t - 2, y(s.ms) - 5)}
                    textAnchor="middle"
                  >
                    ▾ {s.label}
                  </text>
                )
              })}
            <text className="pf__tick" x={PAD.l} y={CHART_H - 2}>
              ms
            </text>
            <text className="pf__tick" x={CHART_W - PAD.r} y={CHART_H - 2} textAnchor="end">
              {frames.length} images · environ{' '}
              {Math.round((frames.length * capture.average) / 1000)} s de jeu
            </text>
          </svg>
        </Zone>

        <div className="pf__bottom">
          <Zone id="breakdown" className="pf__panel">
            <p className="pf__panel-title">{props.breakdown.title}</p>
            <div className="pf__legend" aria-hidden="true">
              <span>
                <i className="pf__swatch pf__swatch--before" /> {props.before.label}
              </span>
              <span>
                <i className="pf__swatch pf__swatch--after" /> {props.after.label}
              </span>
            </div>
            <ul className="pf__systems">
              {props.breakdown.items.map((it) => (
                <li key={it.system}>
                  <span className="pf__system">{it.system}</span>
                  <span className="pf__pair">
                    <span
                      className="pf__hbar pf__hbar--before"
                      style={{ width: `${(it.before / barMax) * 100}%` }}
                    />
                    <span
                      className="pf__hbar pf__hbar--after"
                      style={{ width: `${(it.after / barMax) * 100}%` }}
                    />
                  </span>
                  <span className="pf__values">
                    {ms(it.before)} → {ms(it.after)}
                  </span>
                </li>
              ))}
            </ul>
          </Zone>

          <Zone id="fix" className="pf__panel pf__fix">
            <p className="pf__panel-title">Correction</p>
            <p className="pf__fix-title">{props.fix.title}</p>
            <p className="pf__fix-detail">{props.fix.detail}</p>
            <p className="pf__muted">{props.fix.who}</p>
          </Zone>
        </div>
      </div>
    </AppWindow>
  )
}
