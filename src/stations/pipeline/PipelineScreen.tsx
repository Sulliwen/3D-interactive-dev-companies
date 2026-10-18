import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useGameStore } from '../../state/useGameStore'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { StatusBadge } from '../common/charts'
import { Icon } from '../common/icons'
import type { ScreenComponentProps } from '../types'
import { pipelinePropsSchema } from './schema'
import './pipeline.css'

const TICK_MS = 700

type StageState = 'pending' | 'running' | 'done'

/**
 * Outil fictif « Lumen CI » : la chaîne de mise en production.
 * En mode interactif, les étapes s'allument une à une, puis le déploiement
 * progressif passe de 5 % à 25 % puis 100 % des patients.
 */
export function PipelineScreen({ toolName, props: rawProps }: ScreenComponentProps) {
  const props = useMemo(() => pipelinePropsSchema.parse(rawProps), [rawProps])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion)
  const animate = live && !reducedMotion

  // Une étape = « en cours » puis « terminée » ; puis un pas par palier de déploiement.
  const total = props.stages.length * 2 + props.rollout.steps.length
  const [tick, setTick] = useState(0)
  const [run, setRun] = useState(0)
  const [flagOn, setFlagOn] = useState(true)
  const [rolledBack, setRolledBack] = useState(false)

  useEffect(() => {
    if (!animate) return
    let t = 0
    const id = window.setInterval(() => {
      t += 1
      setTick(t)
      if (t >= total) window.clearInterval(id)
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [animate, total, run])

  // Toutes les zones sont toujours visibles.
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const t = animate ? tick : total
  const stageState = (i: number): StageState =>
    t >= 2 * i + 2 ? 'done' : t === 2 * i + 1 ? 'running' : 'pending'
  const stepsDone = Math.max(0, t - props.stages.length * 2)
  const currentStep = props.rollout.steps[stepsDone - 1]
  const percent = flagOn && currentStep ? currentStep.percent : 0
  const finished = t >= total
  const logShown = Math.max(1, Math.floor((props.log.length * t) / total))
  const tabIndex = live ? 0 : -1

  const replay = () => {
    setTick(0)
    setFlagOn(true)
    setRolledBack(false)
    setRun((r) => r + 1)
  }

  return (
    <AppWindow
      toolName={toolName}
      title={`Pipeline #${props.run.id}`}
      status={
        <>
          <span>
            <Icon name="branch" size={13} /> {props.run.branch} · {props.run.commit}
          </span>
          <span>
            Interrupteur {props.rollout.flag} : {flagOn ? 'activé' : 'coupé'}
          </span>
          <span className="pl__status-right">{props.run.target}</span>
        </>
      }
    >
      <div className="pl">
        <Zone id="pipeline-header" className="pl__header">
          <div>
            <p className="pl__title">{props.run.title}</p>
            <p className="pl__trigger">{props.run.trigger}</p>
          </div>
          <span className="pl__verdict">
            {finished ? (
              <StatusBadge status="good">Terminé</StatusBadge>
            ) : (
              <StatusBadge status="warning">En cours</StatusBadge>
            )}
          </span>
          {live && finished && animate && (
            <button type="button" className="pl__btn" onClick={replay}>
              ▶ Rejouer
            </button>
          )}
        </Zone>

        <ol className="pl__stages">
          {props.stages.map((stage, i) => {
            const state = stageState(i)
            const card = (
              <div className={`pl__stage pl__stage--${state}`}>
                <span className="pl__stage-icon" aria-label={STATE_LABEL[state]}>
                  {state === 'done' ? (
                    <Icon name="check" size={14} />
                  ) : state === 'running' ? (
                    '⟳'
                  ) : (
                    i + 1
                  )}
                </span>
                <p className="pl__stage-label">{stage.label}</p>
                <p className="pl__stage-detail">{stage.detail}</p>
                <p className="pl__stage-duration">
                  {state === 'done' ? stage.duration : STATE_LABEL[state]}
                </p>
              </div>
            )
            return (
              <Fragment key={stage.label}>
                {i > 0 && (
                  <li
                    className={`pl__arrow ${state !== 'pending' ? 'is-lit' : ''}`}
                    aria-hidden="true"
                  >
                    →
                  </li>
                )}
                <li className="pl__stage-item">
                  {stage.zone ? <Zone id={stage.zone}>{card}</Zone> : card}
                </li>
              </Fragment>
            )
          })}
        </ol>

        <div className="pl__bottom">
          <Zone id="rollout" className="pl__card pl__rollout">
            <p className="pl__card-title">Déploiement progressif</p>
            <div
              className="pl__bar"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Part des patients qui ont la nouvelle version"
            >
              <div className="pl__bar-fill" style={{ width: `${percent}%` }} />
              {props.rollout.steps.map((s) => (
                <span key={s.percent} className="pl__bar-mark" style={{ left: `${s.percent}%` }} />
              ))}
            </div>
            <p className="pl__percent">
              <strong>{percent} %</strong> des patients ont la fonctionnalité
            </p>
            <ul className="pl__steps">
              {props.rollout.steps.map((s, k) => (
                <li key={s.percent} className={k < stepsDone ? 'is-done' : ''}>
                  <span className="pl__step-pct">{s.percent} %</span>
                  <span>
                    {s.label}
                    <span className="pl__step-check">
                      {k < stepsDone ? '✓ ' : '○ '}
                      {s.check}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Zone>

          <div className="pl__side">
            <Zone id="feature-flag" className="pl__card pl__flag">
              <p className="pl__card-title">Interrupteur de fonctionnalité</p>
              <div className="pl__flag-row">
                <code>{props.rollout.flag}</code>
                <button
                  type="button"
                  role="switch"
                  aria-checked={flagOn}
                  tabIndex={tabIndex}
                  className={`pl__switch ${flagOn ? 'is-on' : ''}`}
                  onClick={
                    live
                      ? () => {
                          setFlagOn((on) => !on)
                          setRolledBack(false)
                        }
                      : undefined
                  }
                >
                  <span />
                </button>
                <span>{flagOn ? 'Activé' : 'Coupé'}</span>
              </div>
              {rolledBack ? (
                <p className="pl__rollback-msg" role="status">
                  {props.rollout.rollbackMessage}
                </p>
              ) : (
                <button
                  type="button"
                  className="pl__btn pl__btn--danger"
                  tabIndex={tabIndex}
                  disabled={!flagOn}
                  onClick={
                    live
                      ? () => {
                          setFlagOn(false)
                          setRolledBack(true)
                        }
                      : undefined
                  }
                >
                  ↺ Retour arrière
                </button>
              )}
            </Zone>

            <Zone id="job-log" className="pl__card pl__log">
              <p className="pl__card-title">Journal du job</p>
              <Log lines={props.log.slice(0, logShown)} running={!finished} />
            </Zone>
          </div>
        </div>
      </div>
    </AppWindow>
  )
}

const STATE_LABEL: Record<StageState, string> = {
  pending: 'En attente',
  running: 'En cours',
  done: 'Terminé',
}

function Log({ lines, running }: { lines: string[]; running: boolean }): ReactNode {
  // On garde les dernières lignes visibles, comme un terminal qui défile.
  const shown = lines.slice(-12)
  return (
    <div className="pl__log-body" aria-live="polite">
      {shown.map((line, i) => (
        <p key={lines.length - shown.length + i} className={line.startsWith('$') ? 'pl__cmd' : ''}>
          {line}
        </p>
      ))}
      {running && <p className="pl__cursor">▍</p>}
    </div>
  )
}
