import { useEffect, useMemo, useState } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { StatusBadge } from '../common/charts'
import type { ScreenComponentProps } from '../types'
import { BACKLOG_DETAIL_ZONES, backlogPropsSchema, type BacklogItem } from './schema'
import './backlog.css'

const PROJECTS: Record<BacklogItem['project'], string> = {
  'pocket-sante': 'Pocket Santé',
  facturo: 'Facturo',
  mutuelle: 'Mutuelle Horizon',
}

const STATUS: Record<
  BacklogItem['status'],
  { label: string; tone: 'good' | 'warning' | 'neutral' }
> = {
  ready: { label: 'Prête', tone: 'good' },
  refine: { label: 'À affiner', tone: 'warning' },
  idea: { label: 'Idée', tone: 'neutral' },
}

const LINK_ICON = { design: '◧', sprint: '▦', support: '✉' } as const

/** « Lumen Board », vue backlog : la liste priorisée et le détail d'une demande. */
export function BacklogScreen({ toolName, props: rawProps }: ScreenComponentProps) {
  const props = useMemo(() => backlogPropsSchema.parse(rawProps), [rawProps])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  const [selected, setSelected] = useState(props.selected)
  const tab = live ? 0 : -1

  // Une bulle vise le détail de la demande suivie : la rouvrir (pendant le rendu).
  const [handledZone, setHandledZone] = useState<string | null>(null)
  if (revealZone !== handledZone) {
    setHandledZone(revealZone)
    const inDetail = (BACKLOG_DETAIL_ZONES as readonly string[]).includes(revealZone ?? '')
    if (inDetail && selected !== props.selected) setSelected(props.selected)
  }
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, selected, zoneRevealed])

  const item = props.items.find((i) => i.id === selected) ?? props.items[0]!
  const total = props.items.reduce((sum, i) => sum + (i.estimate ?? 0), 0)

  return (
    <AppWindow
      toolName={toolName}
      title={props.board}
      status={
        <>
          <span>{props.items.length} demandes</span>
          <span>{total} points estimés</span>
          <span className="bl__status-right">Trié par priorité</span>
        </>
      }
    >
      <div className="bl">
        <nav className="bl__nav" aria-label="Vues">
          {props.views.map((v, i) => (
            <p key={v} className={`bl__view ${i === 0 ? 'bl__view--active' : ''}`}>
              {v}
            </p>
          ))}
          <Zone id="filters" className="bl__filters">
            <p className="bl__section">Projets</p>
            {Object.entries(PROJECTS).map(([id, label]) => (
              <p key={id} className={`bl__filter bl__filter--${id}`}>
                <i aria-hidden="true" /> {label}
              </p>
            ))}
          </Zone>
        </nav>

        <Zone id="backlog" className="bl__list">
          <p className="bl__list-head">
            <span>Backlog produit</span>
            <span className="bl__muted">priorité ↓</span>
          </p>
          <ol className="bl__rows">
            {props.items.map((it, i) => (
              <li key={it.id}>
                <button
                  type="button"
                  tabIndex={tab}
                  className={`bl__row bl__row--${it.project} ${it.id === item.id ? 'bl__row--selected' : ''}`}
                  aria-pressed={it.id === item.id}
                  onClick={() => setSelected(it.id)}
                >
                  <span className="bl__rank">{i + 1}</span>
                  <span className="bl__row-main">
                    <span className="bl__row-id">{it.id}</span>
                    <span className="bl__row-title">{it.title}</span>
                  </span>
                  <StatusBadge status={STATUS[it.status].tone}>
                    {STATUS[it.status].label}
                  </StatusBadge>
                  <span className="bl__points">{it.estimate ?? '?'}</span>
                </button>
              </li>
            ))}
          </ol>
        </Zone>

        <Zone id="detail" className="bl__detail">
          <Detail item={item} />
        </Zone>
      </div>
    </AppWindow>
  )
}

function Detail({ item }: { item: BacklogItem }) {
  return (
    <div className="bl__detail-inner">
      <p className={`bl__detail-id bl__detail-id--${item.project}`}>
        {item.id} · {PROJECTS[item.project]}
      </p>
      <p className="bl__detail-title">{item.title}</p>
      <p className="bl__badges">
        <StatusBadge status={STATUS[item.status].tone}>{STATUS[item.status].label}</StatusBadge>
        <span className="bl__muted">User story</span>
      </p>

      <div className="bl__footer">
        {item.estimate !== null && (
          <Zone id="estimate" className="bl__estimate">
            <span className="bl__estimate-value">{item.estimate}</span>
            <span>
              points
              {item.estimateNote && <span className="bl__muted"> · {item.estimateNote}</span>}
            </span>
          </Zone>
        )}
        {item.links && (
          <Zone id="links" className="bl__links">
            {item.links.map((l) => (
              <span key={l.label} className="bl__link">
                <span aria-hidden="true">{LINK_ICON[l.kind]}</span> {l.label}
              </span>
            ))}
          </Zone>
        )}
      </div>

      {item.story ? (
        <Zone id="story" className="bl__story">
          <p>
            <span className="bl__kw">En tant que</span> {item.story.asA},
          </p>
          <p>
            <span className="bl__kw">je veux</span> {item.story.iWant},
          </p>
          <p>
            <span className="bl__kw">afin de</span> {item.story.soThat}.
          </p>
        </Zone>
      ) : (
        item.description && <p className="bl__description">{item.description}</p>
      )}

      {item.origin && <p className="bl__origin">{item.origin}</p>}

      {item.criteria && (
        <Zone id="criteria" className="bl__criteria">
          <p className="bl__section">Critères d'acceptation</p>
          <ol>
            {item.criteria.map((c, i) => (
              <li key={i}>
                {typeof c === 'string' ? (
                  c
                ) : (
                  <span className="bl__gherkin">
                    <span>
                      <span className="bl__kw">Étant donné</span> {c.given}
                    </span>
                    <span>
                      <span className="bl__kw">Quand</span> {c.when}
                    </span>
                    <span>
                      <span className="bl__kw">Alors</span> {c.then}
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ol>
        </Zone>
      )}
    </div>
  )
}
