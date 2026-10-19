import { useEffect, useMemo } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { Icon } from '../common/icons'
import type { ScreenComponentProps } from '../types'
import { milestonePlanPropsSchema } from './schema'
import './milestone-plan.css'

const STATUS_LABEL = { done: 'Fait', doing: 'En cours', todo: 'À faire' } as const

const EVENT_LABEL = {
  freeze: 'Gel',
  playtest: 'Playtest',
  recording: 'Voix',
  demo: 'Démo',
  launch: 'Sortie',
  press: 'Presse',
  other: 'Repère',
} as const

/**
 * « Tableau des tâches », vue jalon : la date, les semaines qui restent et leurs dates clés,
 * ce qui doit être prêt, ce qu'on coupe, et la charge de l'équipe.
 */
export function MilestonePlanScreen({ toolName, props: raw }: ScreenComponentProps) {
  const p = useMemo(() => milestonePlanPropsSchema.parse(raw), [raw])
  const { revealZone, zoneRevealed } = useAnnotations()
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const done = p.scope.filter((s) => s.status === 'done').length

  return (
    <AppWindow
      toolName={toolName}
      title={p.view}
      status={
        <>
          <span>{p.status}</span>
          <span style={{ marginLeft: 'auto' }}>
            {done} sur {p.scope.length} {p.scopeCount}
          </span>
        </>
      }
    >
      <div className="mp">
        <Zone id="milestone" className="mp__milestone">
          <span className="mp__countdown">{p.milestone.countdown}</span>
          <div>
            <p className="mp__name">{p.milestone.name}</p>
            <p className="mp__goal">{p.milestone.goal}</p>
          </div>
          <span className="mp__date">{p.milestone.date}</span>
        </Zone>

        <Zone id="calendar" className="mp__calendar">
          {p.weeks.map((w) => (
            <div key={w.label} className={`mp__week ${w.current ? 'is-current' : ''}`}>
              <p className="mp__week-label">
                {w.label}
                <span>{w.dates}</span>
              </p>
              <p className="mp__focus">{w.focus}</p>
              <ul className="mp__events">
                {w.events.map((e) => (
                  <li key={e.label} className={`mp__event mp__event--${e.kind}`}>
                    <span className="mp__event-kind">{EVENT_LABEL[e.kind]}</span>
                    <span className="mp__event-day">{e.day}</span>
                    {e.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Zone>

        <div className="mp__bottom">
          <Zone id="scope" className="mp__panel">
            <p className="mp__heading">{p.scopeTitle}</p>
            <ul className="mp__scope">
              {p.scope.map((s) => (
                <li key={s.title} className={`is-${s.status}`}>
                  <span className="mp__check" aria-hidden="true">
                    {s.status === 'done' && <Icon name="check" size={11} />}
                  </span>
                  <span className="mp__scope-title">{s.title}</span>
                  <span className="mp__owner">{s.owner}</span>
                  <span className="mp__state">{STATUS_LABEL[s.status]}</span>
                </li>
              ))}
            </ul>
          </Zone>

          <Zone id="cuts" className="mp__panel mp__cuts">
            <p className="mp__heading">{p.cutsTitle}</p>
            <ul>
              {p.cuts.map((c) => (
                <li key={c.title}>
                  <p className="mp__cut-title">{c.title}</p>
                  <p className="mp__cut-reason">{c.reason}</p>
                  <span className="mp__cut-to">→ {c.to}</span>
                </li>
              ))}
            </ul>
          </Zone>

          <Zone id="capacity" className="mp__panel mp__capacity">
            <p className="mp__heading">{p.capacityTitle}</p>
            <p className="mp__rule">{p.capacity.rule}</p>
            <ul>
              {p.capacity.rows.map((r) => {
                const ratio = r.planned / r.available
                return (
                  <li key={r.team}>
                    <span className="mp__team">{r.team}</span>
                    <span className="mp__gauge" aria-hidden="true">
                      <i
                        className={ratio > 1 ? 'is-over' : ratio > 0.9 ? 'is-full' : ''}
                        style={{ width: `${Math.min(100, ratio * 100)}%` }}
                      />
                    </span>
                    <span className="mp__load">
                      {r.planned} / {r.available} {p.capacity.unit}
                    </span>
                  </li>
                )
              })}
            </ul>
          </Zone>
        </div>
      </div>
    </AppWindow>
  )
}
