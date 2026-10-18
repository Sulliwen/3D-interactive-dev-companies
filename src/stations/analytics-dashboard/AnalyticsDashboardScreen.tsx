import { useEffect, useMemo, useState } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { BarChart, LineChart, StatTile } from '../common/charts'
import type { ScreenComponentProps } from '../types'
import { analyticsDashboardPropsSchema } from './schema'
import './analytics-dashboard.css'

/** « Lumen Insights » : tableau de bord d'analyse (chiffres clés, tendance, répartition). */
export function AnalyticsDashboardScreen({ toolName, props: raw }: ScreenComponentProps) {
  const props = useMemo(() => analyticsDashboardPropsSchema.parse(raw), [raw])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  const [showQuery, setShowQuery] = useState(true)
  // Tout est visible d'emblée, sauf la requête qu'on peut replier : on la rouvre si besoin.
  const [handled, setHandled] = useState<string | null>(null)
  if (revealZone !== handled) {
    setHandled(revealZone)
    if (revealZone === 'query') setShowQuery(true)
  }
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const unit = props.trend.unit
  const fmt = (v: number) => `${v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}${unit}`

  return (
    <AppWindow
      toolName={toolName}
      title={props.dashboard}
      titleRight={<span className="ad__period">{props.period}</span>}
      status={
        <>
          <span>Données mises à jour ce matin à 6 h 00</span>
          <span style={{ marginLeft: 'auto' }}>Données anonymisées · aucun nom de patient</span>
        </>
      }
    >
      <div className="ad">
        <Zone id="tiles" className="ad__tiles">
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

        <div className="ad__charts">
          <Zone id="trend" className="ad__panel">
            <p className="ad__heading">{props.trend.title}</p>
            <LineChart
              width={430}
              height={200}
              labels={props.trend.labels}
              series={[
                {
                  id: 'trend',
                  label: props.trend.seriesLabel,
                  values: props.trend.values,
                  slot: 1,
                },
              ]}
              format={fmt}
              yMax={props.trend.yMax}
            />
          </Zone>
          <Zone id="breakdown" className="ad__panel">
            <p className="ad__heading">{props.breakdown.title}</p>
            <BarChart
              width={400}
              height={200}
              bars={props.breakdown.bars}
              label={props.breakdown.valueLabel}
            />
          </Zone>
        </div>

        <div className="ad__bottom">
          <Zone id="query" className="ad__panel ad__query">
            <p className="ad__heading">
              {props.query.title}
              {live && (
                <button
                  type="button"
                  className="ad__toggle"
                  onClick={() => setShowQuery((s) => !s)}
                  aria-expanded={showQuery}
                >
                  {showQuery ? 'Masquer la requête' : 'Voir la requête'}
                </button>
              )}
            </p>
            {showQuery && (
              <pre className="ad__code">
                {props.query.lines.map((l, i) => (
                  <span key={i} className={l.trim().startsWith('--') ? 'ad__comment' : ''}>
                    {l}
                    {'\n'}
                  </span>
                ))}
              </pre>
            )}
            <p className="ad__result">
              Résultat : <strong>{props.query.result}</strong>
            </p>
          </Zone>
          <Zone id="hypothesis" className="ad__panel ad__hypothesis">
            <p className="ad__heading">{props.hypothesis.title}</p>
            <p className="ad__hyp-value">{props.hypothesis.value}</p>
            <p className="ad__hyp-text">{props.hypothesis.text}</p>
          </Zone>
        </div>
      </div>
    </AppWindow>
  )
}
