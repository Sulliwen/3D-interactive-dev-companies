import { useEffect, useMemo, useState } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { StatusBadge } from '../common/charts'
import type { ScreenComponentProps } from '../types'
import { peoplePropsSchema } from './schema'
import './people.css'

/** Outil de management fictif « Lumen People » (écran mural de la salle de réunion). */
export function PeopleScreen({ toolName, props: rawProps }: ScreenComponentProps) {
  const props = useMemo(() => peoplePropsSchema.parse(rawProps), [rawProps])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  const [tasks, setTasks] = useState(() => props.onboarding.tasks.map((t) => t.done))
  const tab = live ? 0 : -1

  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const { oneOnOne, hiring, workload } = props
  const funnelMax = Math.max(...hiring.stages.map((s) => s.count))

  return (
    <AppWindow
      toolName={toolName}
      title={props.team.name}
      titleRight="Nadia B. · Engineering Manager"
      status={
        <>
          <span>
            {props.team.name} · {props.team.size} personnes
          </span>
          <span>{workload.sprint}</span>
          <span className="pp__status-right">Visible par Nadia uniquement</span>
        </>
      }
    >
      <div className="pp">
        <Zone id="one-on-one" className="pp__card pp__one">
          <p className="pp__title">Entretien individuel · {oneOnOne.with}</p>
          <p className="pp__when">{oneOnOne.when}</p>
          <p className="pp__subtitle">Sujets proposés par {oneOnOne.with.split(' ')[0]}</p>
          <ul className="pp__agenda">
            {oneOnOne.agenda.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <Zone id="goals" className="pp__goals">
            <p className="pp__subtitle">Objectifs de progression</p>
            {oneOnOne.goals.map((g) => (
              <div key={g.label} className="pp__goal">
                <span className="pp__goal-label">
                  {g.label} <b>{g.progress} %</b>
                </span>
                <span className="pp__bar" role="img" aria-label={`${g.progress} %`}>
                  <span style={{ width: `${g.progress}%` }} />
                </span>
              </div>
            ))}
          </Zone>
          <p className="pp__kudos">
            <span aria-hidden="true">★</span> <b>{oneOnOne.kudos.from}</b> : « {oneOnOne.kudos.text}{' '}
            »
          </p>
        </Zone>

        <div className="pp__col">
          <Zone id="hiring" className="pp__card">
            <p className="pp__title">Recrutement · {hiring.role}</p>
            <ul className="pp__funnel">
              {hiring.stages.map((s) => (
                <li key={s.label}>
                  <span className="pp__funnel-label">{s.label}</span>
                  <span className="pp__funnel-bar">
                    <span style={{ width: `${Math.max(6, (s.count / funnelMax) * 100)}%` }} />
                  </span>
                  <b>{s.count}</b>
                </li>
              ))}
            </ul>
            <p className="pp__note">{hiring.note}</p>
          </Zone>

          <Zone id="onboarding" className="pp__card">
            <p className="pp__title">{props.onboarding.title}</p>
            <ul className="pp__tasks">
              {props.onboarding.tasks.map((t, i) => (
                <li key={t.label}>
                  <label>
                    <input
                      type="checkbox"
                      tabIndex={tab}
                      checked={tasks[i] ?? false}
                      disabled={!live}
                      onChange={(e) =>
                        setTasks((prev) => prev.map((v, j) => (j === i ? e.target.checked : v)))
                      }
                    />
                    {t.label}
                  </label>
                </li>
              ))}
            </ul>
          </Zone>
        </div>

        <Zone id="workload" className="pp__card pp__workload">
          <p className="pp__title">Charge de l'équipe · {workload.sprint}</p>
          <ul>
            {workload.members.map((m) => {
              const ratio = m.committed / m.capacity
              const status = ratio >= 0.9 ? 'warning' : 'good'
              return (
                <li key={m.name}>
                  <span className="pp__member">
                    <b>{m.name}</b>
                    <span>{m.role}</span>
                  </span>
                  <span className="pp__load">
                    <span className="pp__bar">
                      <span
                        className={status === 'warning' ? 'pp__bar--warning' : ''}
                        style={{ width: `${Math.min(100, ratio * 100)}%` }}
                      />
                    </span>
                    <span className="pp__points">
                      {m.committed} / {m.capacity} pts
                    </span>
                  </span>
                  <StatusBadge status={status}>
                    {status === 'warning' ? 'À surveiller' : 'OK'}
                  </StatusBadge>
                  {m.note && <span className="pp__member-note">{m.note}</span>}
                </li>
              )
            })}
          </ul>
        </Zone>
      </div>
    </AppWindow>
  )
}
