import { useEffect, useMemo, useState } from 'react'
import { useGameStore } from '../../state/useGameStore'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { LineChart, StatTile, StatusBadge } from '../common/charts'
import type { ScreenComponentProps } from '../types'
import { monitoringPropsSchema } from './schema'
import './monitoring.css'

const STATUS_LABEL = {
  good: 'Opérationnel',
  warning: 'Dégradé',
  serious: 'Perturbé',
  critical: 'En panne',
} as const

const percent = (v: number) => `${v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`

/** Outil de supervision fictif « Lumen Watch ». */
export function MonitoringScreen({ toolName, props: rawProps }: ScreenComponentProps) {
  const props = useMemo(() => monitoringPropsSchema.parse(rawProps), [rawProps])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion)
  const animate = live && !reducedMotion
  const total = props.slots.labels.length
  const [shown, setShown] = useState(2)

  // En direct, les jours s'affichent un à un sur la courbe.
  useEffect(() => {
    if (!animate) return
    let count = 2
    const id = window.setInterval(() => {
      count += 1
      setShown(count)
      if (count >= total) window.clearInterval(id)
    }, 650)
    return () => window.clearInterval(id)
  }, [animate, total])

  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const visible = animate ? shown : total
  const yMax = Math.ceil(Math.max(...props.slots.freed.values) / 50) * 50

  return (
    <AppWindow
      toolName={toolName}
      title="Pocket Santé · Annulation des rendez-vous"
      titleRight={
        <span className="mon__live">
          <i aria-hidden="true" /> En direct
        </span>
      }
      status={
        <>
          <span>Production · 100 % des utilisateurs</span>
          <span>Interrupteur « annulation-rdv » : activé</span>
          <span className="mon__status-right">{props.period}</span>
        </>
      }
    >
      <div className="mon">
        <Zone id="tiles" className="mon__tiles">
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

        <div className="mon__charts">
          <Zone id="slots" className="mon__panel">
            <p className="mon__panel-title">{props.slots.title}</p>
            <LineChart
              width={436}
              height={150}
              yMax={yMax}
              labels={props.slots.labels.slice(0, visible)}
              series={[
                {
                  id: 'freed',
                  label: props.slots.freed.label,
                  values: props.slots.freed.values.slice(0, visible),
                  slot: 1,
                },
                {
                  id: 'taken',
                  label: props.slots.taken.label,
                  values: props.slots.taken.values.slice(0, visible),
                  slot: 3,
                },
              ]}
            />
          </Zone>

          <Zone id="no-show" className="mon__panel">
            <p className="mon__panel-title">{props.noShow.title}</p>
            <LineChart
              width={436}
              height={168}
              yMax={20}
              format={percent}
              labels={props.noShow.labels}
              marker={{ index: props.noShow.launchIndex, label: props.noShow.launchLabel }}
              series={[
                { id: 'no-show', label: props.noShow.title, values: props.noShow.values, slot: 2 },
              ]}
            />
          </Zone>
        </div>

        <div className="mon__bottom">
          <Zone id="services" className="mon__panel mon__services">
            <p className="mon__panel-title">État des services</p>
            <ul>
              {props.services.map((s) => (
                <li key={s.name}>
                  <span className="mon__service">{s.name}</span>
                  <span className="mon__service-detail">{s.detail}</span>
                  <StatusBadge status={s.status}>{STATUS_LABEL[s.status]}</StatusBadge>
                </li>
              ))}
            </ul>
          </Zone>

          <Zone id="incident" className="mon__panel mon__incident">
            <p className="mon__panel-title">Dernière alerte</p>
            <p className="mon__incident-title">
              <StatusBadge status="serious">Alerte</StatusBadge> {props.incident.title}
            </p>
            <p className="mon__muted">{props.incident.when}</p>
            <p className="mon__incident-detail">
              <StatusBadge status="good">Résolu</StatusBadge> {props.incident.detail}
            </p>
          </Zone>

          <Zone id="loop" className="mon__panel mon__loop">
            <p className="mon__panel-title">{props.loop.title}</p>
            <p className="mon__loop-count">{props.loop.count}</p>
            <p className="mon__quote">« {props.loop.quote} »</p>
            <p className="mon__loop-action">↻ {props.loop.action}</p>
          </Zone>
        </div>
      </div>
    </AppWindow>
  )
}
