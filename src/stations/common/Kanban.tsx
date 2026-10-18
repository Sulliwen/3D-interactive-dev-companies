import { Zone } from './annotations'
import './common.css'

export interface KanbanCard {
  id: string
  title: string
  /** Projet : la couleur suit le projet (Pocket Santé, Facturo, mutuelle). */
  project: 'pocket-sante' | 'facturo' | 'mutuelle'
  /** Estimation (points). */
  estimate?: number
  assignee?: string
  tag?: string
  /** Carte mise en avant (la fonctionnalité suivie). */
  highlight?: boolean
  /** Zone de pastille posée sur cette carte. */
  zone?: string
}

export interface KanbanColumn {
  id: string
  title: string
  cards: KanbanCard[]
  /** Zone de pastille posée sur la colonne. */
  zone?: string
}

const PROJECT_LABEL: Record<KanbanCard['project'], string> = {
  'pocket-sante': 'Pocket Santé',
  facturo: 'Facturo',
  mutuelle: 'Mutuelle',
}

/** Tableau en colonnes (backlog, sprint) ; les cartes portent la couleur de leur projet. */
export function Kanban({
  columns,
  onSelect,
  selected,
}: {
  columns: KanbanColumn[]
  onSelect?: (cardId: string) => void
  selected?: string | null
}) {
  return (
    <div className="kanban">
      {columns.map((col) => {
        const content = (
          <>
            <p className="kanban__col-title">
              {col.title} <span>{col.cards.length}</span>
            </p>
            <div className="kanban__cards">
              {col.cards.map((card) => {
                const body = (
                  <button
                    type="button"
                    className={`kanban__card kanban__card--${card.project} ${card.highlight ? 'kanban__card--highlight' : ''} ${selected === card.id ? 'kanban__card--selected' : ''}`}
                    onClick={onSelect ? () => onSelect(card.id) : undefined}
                    tabIndex={onSelect ? 0 : -1}
                  >
                    <span className="kanban__project">{PROJECT_LABEL[card.project]}</span>
                    <span className="kanban__title">{card.title}</span>
                    <span className="kanban__meta">
                      {card.tag && <span className="kanban__tag">{card.tag}</span>}
                      {card.estimate !== undefined && (
                        <span className="kanban__estimate">{card.estimate} pts</span>
                      )}
                      {card.assignee && <span className="kanban__assignee">{card.assignee}</span>}
                    </span>
                  </button>
                )
                return card.zone ? (
                  <Zone key={card.id} id={card.zone}>
                    {body}
                  </Zone>
                ) : (
                  <div key={card.id}>{body}</div>
                )
              })}
            </div>
          </>
        )
        return col.zone ? (
          <Zone key={col.id} id={col.zone} className="kanban__col">
            {content}
          </Zone>
        ) : (
          <div key={col.id} className="kanban__col">
            {content}
          </div>
        )
      })}
    </div>
  )
}
