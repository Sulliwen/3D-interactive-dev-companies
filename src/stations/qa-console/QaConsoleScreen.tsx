import { useEffect, useMemo, useState } from 'react'
import { useGameStore } from '../../state/useGameStore'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { StatusBadge } from '../common/charts'
import { PocketSantePhone } from '../common/PocketSantePhone'
import type { ScreenComponentProps } from '../types'
import { qaConsolePropsSchema, type QaConsoleProps } from './schema'
import './qa-console.css'

/** Console de tests fictive « Lumen Test » : automatique, recette manuelle, bugs. */
export function QaConsoleScreen({ toolName, props: rawProps }: ScreenComponentProps) {
  const props = useMemo(() => qaConsolePropsSchema.parse(rawProps), [rawProps])
  const { live } = useAnnotations()
  const [filter, setFilter] = useState<'all' | 'fail'>('all')
  const [retested, setRetested] = useState(false)
  const tab = live ? 0 : -1

  const cases = props.cases.filter((c) => filter === 'all' || c.result === 'fail')
  const firstEdge = cases.findIndex((c) => c.edge)
  const edgeCount = cases.filter((c) => c.edge).length
  const failures = props.cases.filter((c) => c.result === 'fail').length

  return (
    <AppWindow toolName={toolName} title={props.campaign} status={<span>{props.status}</span>}>
      <div className="qa__left">
        <AutoTests suites={props.suites} />

        <Zone id="manual-plan" className="qa__card qa__plan">
          <div className="qa__card-head">
            <p className="qa__card-title">
              Recette manuelle · {props.cases.length - failures} / {props.cases.length}
            </p>
            {live && (
              <div className="qa__filters" role="group" aria-label="Filtrer les cas">
                <button
                  type="button"
                  tabIndex={tab}
                  aria-pressed={filter === 'all'}
                  onClick={() => setFilter('all')}
                >
                  Tous
                </button>
                <button
                  type="button"
                  tabIndex={tab}
                  aria-pressed={filter === 'fail'}
                  onClick={() => setFilter('fail')}
                >
                  Échecs ({failures})
                </button>
              </div>
            )}
          </div>
          <div className="qa__rows" role="table" aria-label="Plan de recette">
            {cases.map((c, i) => {
              if (c.edge && i !== firstEdge) return null
              const rows = c.edge ? cases.slice(i, i + edgeCount) : [c]
              const content = rows.map((r) => (
                <div
                  key={r.label}
                  role="row"
                  className={`qa__row ${r.result === 'fail' ? 'qa__row--fail' : ''}`}
                >
                  <span role="cell" className="qa__result">
                    {r.result === 'pass' ? (
                      <StatusBadge status="good">Réussi</StatusBadge>
                    ) : (
                      <StatusBadge status="critical">Échec</StatusBadge>
                    )}
                  </span>
                  <span role="cell" className="qa__case">
                    {r.label}
                    {r.bug && <span className="qa__bug-ref"> → {r.bug}</span>}
                  </span>
                  <span role="cell" className="qa__device">
                    {r.device}
                  </span>
                </div>
              ))
              return c.edge ? (
                <Zone key="edge" id="edge-cases" className="qa__edge">
                  {content}
                </Zone>
              ) : (
                content
              )
            })}
          </div>
        </Zone>
      </div>

      <Zone id="bug-report" className="qa__bug">
        <div className="qa__bug-head">
          <span className="qa__bug-id">{props.bug.id}</span>
          <StatusBadge status="serious">{props.bug.severity}</StatusBadge>
          <span className="qa__bug-device">{props.bug.device}</span>
        </div>
        <p className="qa__bug-title">{props.bug.title}</p>
        <div className="qa__bug-body">
          <PocketSantePhone
            state="too-late"
            when={props.bug.when}
            caption={props.bug.caption}
            width={118}
          />
          <div className="qa__bug-details">
            <p className="qa__label">Étapes pour reproduire</p>
            <ol>
              {props.bug.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p className="qa__label">Attendu</p>
            <p>{props.bug.expected}</p>
            <p className="qa__label">Obtenu</p>
            <p className="qa__actual">{props.bug.actual}</p>
          </div>
        </div>

        <Zone id="bug-cause" className="qa__cause">
          <p className="qa__label">Cause</p>
          <p>{props.bug.cause.text}</p>
          <p className="qa__diff">
            <code className="qa__del">− {props.bug.cause.before}</code>
            <code className="qa__add">+ {props.bug.cause.after}</code>
          </p>
        </Zone>

        <Zone id="retest" className="qa__retest">
          <span>
            Assigné à <strong>{props.bug.assignee}</strong>
          </span>
          {retested ? (
            <StatusBadge status="good">{props.bug.statusAfter}</StatusBadge>
          ) : (
            <StatusBadge status="warning">{props.bug.statusBefore}</StatusBadge>
          )}
          {live && !retested && (
            <button
              type="button"
              className="qa__retest-btn"
              tabIndex={tab}
              onClick={() => setRetested(true)}
            >
              {props.bug.retestLabel}
            </button>
          )}
        </Zone>
      </Zone>
    </AppWindow>
  )
}

/** Barre empilée des tests automatiques (une couleur par famille, ordre fixe). */
function AutoTests({ suites }: { suites: QaConsoleProps['suites'] }) {
  const { live } = useAnnotations()
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion)
  const animate = live && !reducedMotion
  const total = suites.reduce((n, s) => n + s.total, 0)
  const passed = suites.reduce((n, s) => n + s.passed, 0)
  const [progress, setProgress] = useState(0)

  // En direct, la campagne « tourne » : le compteur monte jusqu'au total.
  useEffect(() => {
    if (!animate) return
    let p = 0
    const id = window.setInterval(() => {
      p = Math.min(1, p + 0.04)
      setProgress(p)
      if (p >= 1) window.clearInterval(id)
    }, 50)
    return () => window.clearInterval(id)
  }, [animate])

  const shown = animate ? progress : 1
  const done = Math.round(passed * shown)

  return (
    <Zone id="auto-tests" className="qa__card qa__auto">
      <div className="qa__card-head">
        <p className="qa__card-title">Tests automatiques</p>
        {shown >= 1 ? (
          <StatusBadge status="good">
            {passed} / {total} réussis
          </StatusBadge>
        ) : (
          <StatusBadge status="neutral">
            {done} / {total} en cours…
          </StatusBadge>
        )}
      </div>
      <div
        className="qa__bar"
        role="img"
        aria-label={suites.map((s) => `${s.label} : ${s.passed} sur ${s.total}`).join(', ')}
      >
        {suites.map((s, i) => (
          <span
            key={s.label}
            style={{
              flexGrow: s.total,
              background: `var(--series-${i + 1})`,
              clipPath: `inset(0 ${100 - Math.min(100, Math.max(0, shown * suites.length - i) * 100)}% 0 0)`,
            }}
          />
        ))}
      </div>
      <p className="qa__legend">
        {suites.map((s, i) => (
          <span key={s.label}>
            <i style={{ background: `var(--series-${i + 1})` }} /> {s.label} · {s.passed}
          </span>
        ))}
      </p>
    </Zone>
  )
}
