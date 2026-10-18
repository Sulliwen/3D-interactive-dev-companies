import { useEffect, useMemo, useState } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { Kanban } from '../common/Kanban'
import type { ScreenComponentProps } from '../types'
import { Burndown } from './Burndown'
import { sprintBoardPropsSchema } from './schema'
import './sprint-board.css'

type NotesTab = 'daily' | 'retro'

/** « Lumen Board », vue sprint : tableau, objectif, burndown, notes du daily et de la rétro. */
export function SprintBoardScreen({ toolName, props: rawProps }: ScreenComponentProps) {
  const props = useMemo(() => sprintBoardPropsSchema.parse(rawProps), [rawProps])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  const [tab, setTab] = useState<NotesTab>('daily')

  // Une bulle vise les notes du daily ou de la rétro : afficher le bon onglet (pendant le rendu).
  const [handledZone, setHandledZone] = useState<string | null>(null)
  if (revealZone !== handledZone) {
    setHandledZone(revealZone)
    if ((revealZone === 'daily' || revealZone === 'retro') && revealZone !== tab) setTab(revealZone)
  }
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, tab, zoneRevealed])

  const done = props.columns.at(-1)?.cards.reduce((s, c) => s + (c.estimate ?? 0), 0) ?? 0
  const { burndown } = props

  return (
    <AppWindow
      toolName={toolName}
      title={`${props.sprint.name} · tableau du sprint`}
      status={
        <>
          <span>{props.sprint.name}</span>
          <span>{props.sprint.day}</span>
          <span>
            {done} points terminés sur {burndown.total}
          </span>
        </>
      }
    >
      <div className="sb">
        <Zone id="goal" className="sb__goal">
          <span className="sb__sprint">{props.sprint.name}</span>
          <span className="sb__dates">
            {props.sprint.dates} · {props.sprint.day}
          </span>
          <span className="sb__goal-text">
            <span className="sb__goal-label">Objectif</span> {props.sprint.goal}
          </span>
        </Zone>

        <div className="sb__main">
          <Zone id="board" className="sb__board">
            <Kanban columns={props.columns} />
            <p className="sb__legend" aria-label="Couleur des cartes">
              <span className="sb__legend--pocket-sante">Pocket Santé</span>
              <span className="sb__legend--facturo">Facturo</span>
              <span className="sb__legend--mutuelle">Mutuelle Horizon</span>
              {props.columns.some((c) => c.cards.some((k) => k.project === 'tournee')) && (
                <span className="sb__legend--tournee">Tournée</span>
              )}
            </p>
          </Zone>

          <div className="sb__side">
            <Zone id="burndown" className="sb__panel">
              <p className="sb__panel-title">Avancement du sprint (burndown)</p>
              <Burndown
                labels={burndown.labels}
                actual={burndown.actual}
                total={burndown.total}
                todayIndex={burndown.todayIndex}
                width={312}
                height={136}
              />
            </Zone>

            <div className="sb__panel sb__notes">
              <div className="sb__tabs" role="tablist" aria-label="Notes de l'équipe">
                {(
                  [
                    ['daily', 'Daily du jour'],
                    ['retro', `Rétro ${props.retro.sprint}`],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    tabIndex={live ? 0 : -1}
                    aria-selected={tab === id}
                    className={`sb__tab ${tab === id ? 'sb__tab--active' : ''}`}
                    onClick={() => setTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {tab === 'daily' ? (
                <Zone id="daily" className="sb__notes-body">
                  <p className="sb__when">{props.daily.when}</p>
                  {props.daily.entries.map((e) => (
                    <div key={e.person} className="sb__entry">
                      <p className="sb__person">{e.person}</p>
                      <p>
                        <span className="sb__k">Hier :</span> {e.yesterday}
                      </p>
                      <p>
                        <span className="sb__k">Aujourd'hui :</span> {e.today}
                      </p>
                      {e.blocker && (
                        <p className="sb__blocker">
                          <span className="sb__k">Blocage :</span> {e.blocker}
                        </p>
                      )}
                    </div>
                  ))}
                </Zone>
              ) : (
                <Zone id="retro" className="sb__notes-body sb__retro">
                  <RetroList title="Ce qui a bien marché" items={props.retro.good} tone="good" />
                  <RetroList title="Ce qui a coincé" items={props.retro.improve} tone="improve" />
                  <RetroList title="Ce qu'on change" items={props.retro.actions} tone="action" />
                </Zone>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppWindow>
  )
}

function RetroList({
  title,
  items,
  tone,
}: {
  title: string
  items: string[]
  tone: 'good' | 'improve' | 'action'
}) {
  return (
    <div className={`sb__retro-col sb__retro-col--${tone}`}>
      <p className="sb__retro-title">{title}</p>
      <ul>
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </div>
  )
}
