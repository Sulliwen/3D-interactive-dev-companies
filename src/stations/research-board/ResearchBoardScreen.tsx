import { useEffect, useMemo, useState } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import type { ScreenComponentProps } from '../types'
import { researchBoardPropsSchema, type ResearchBoardProps } from './schema'
import './research-board.css'

const FEELING_LABEL = { good: 'Serein', neutral: 'Neutre', bad: 'Frustré' } as const
const FEELING_Y = { good: 14, neutral: 38, bad: 62 } as const

/** « Carnet UX » : synthèse d'une étude utilisateur (affinités, persona, parcours). */
export function ResearchBoardScreen({ toolName, props: raw }: ScreenComponentProps) {
  const props = useMemo(() => researchBoardPropsSchema.parse(raw), [raw])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  // Tout est toujours visible : rien à faire défiler pour une pastille.
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const total = props.sources.patients + props.sources.secretaries

  return (
    <AppWindow
      toolName={toolName}
      title={props.study}
      status={
        <>
          <span>
            {total} entretiens · {props.sources.patients} {props.sources.labels[0]} ·{' '}
            {props.sources.secretaries} {props.sources.labels[1]}
          </span>
          <span style={{ marginLeft: 'auto' }}>Synthèse partagée avec l'équipe produit</span>
        </>
      }
    >
      <div className="rb">
        <div className="rb__left">
          <Zone id="affinity" className="rb__panel rb__affinity">
            <p className="rb__heading">Carte d'affinités · citations regroupées par thème</p>
            <Affinity themes={props.themes} live={live} />
          </Zone>
          <Zone id="journey" className="rb__panel rb__journey">
            <p className="rb__heading">
              {props.journeyTitle ??
                `Parcours de ${props.persona.name} pour annuler un rendez-vous`}
            </p>
            <Journey journey={props.journey} />
          </Zone>
        </div>

        <div className="rb__right">
          <Zone id="persona" className="rb__panel rb__persona">
            <div className="rb__persona-head">
              <span className="rb__avatar" aria-hidden="true">
                {props.persona.name.charAt(0)}
              </span>
              <div>
                <p className="rb__persona-name">
                  {props.persona.name}, {props.persona.age} ans
                </p>
                <p className="rb__muted">{props.persona.role}</p>
              </div>
              <span className="rb__tag">Persona</span>
            </div>
            <p className="rb__quote">« {props.persona.quote} »</p>
            <div className="rb__lists">
              <div>
                <p className="rb__sub">Besoins</p>
                <ul>
                  {props.persona.needs.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="rb__sub">Frustrations</p>
                <ul>
                  {props.persona.frustrations.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Zone>

          <Zone id="problem" className="rb__panel rb__problem">
            <p className="rb__sub">Problème qualifié</p>
            <p className="rb__problem-text">{props.problem}</p>
          </Zone>

          <Zone id="sources" className="rb__panel rb__sources">
            <p className="rb__sub">Sources</p>
            <p className="rb__sources-row">
              <span>
                <strong>{props.sources.patients}</strong> {props.sources.labels[0]}
              </span>
              <span>
                <strong>{props.sources.secretaries}</strong> {props.sources.labels[1]}
              </span>
              <span>
                <strong>{props.interviewLength}</strong> par entretien
              </span>
            </p>
          </Zone>
        </div>
      </div>
    </AppWindow>
  )
}

function Affinity({ themes, live }: { themes: ResearchBoardProps['themes']; live: boolean }) {
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <div className="rb__themes">
      {themes.map((theme, t) => (
        <div key={theme.title} className="rb__theme">
          <p className="rb__theme-title">
            {theme.title} <span>{theme.notes.length}</span>
          </p>
          {theme.notes.map((note, i) => {
            const id = `${t}-${i}`
            const open = selected === id
            return (
              <button
                key={id}
                type="button"
                tabIndex={live ? 0 : -1}
                className={`rb__note rb__note--${t % 3} ${open ? 'rb__note--open' : ''}`}
                style={{ rotate: `${((i * 7 + t * 3) % 5) - 2}deg` }}
                aria-expanded={open}
                onClick={() => setSelected(open ? null : id)}
              >
                « {note.text} »{open && <span className="rb__who">— {note.who}</span>}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function Journey({ journey }: { journey: ResearchBoardProps['journey'] }) {
  const width = 520
  const step = width / journey.length
  const points = journey.map((j, i) => [step * i + step / 2, FEELING_Y[j.feeling]] as const)

  return (
    <div className="rb__journey-body">
      <svg width={width} height={76} role="img" aria-label="Ressenti à chaque étape du parcours">
        <line x1={0} x2={width} y1={FEELING_Y.neutral} y2={FEELING_Y.neutral} className="rb__mid" />
        <polyline
          points={points.map(([x, y]) => `${x},${y}`).join(' ')}
          fill="none"
          stroke="var(--series-1)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {points.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={5}
            fill={journey[i]!.feeling === 'bad' ? 'var(--status-serious)' : 'var(--series-1)'}
            stroke="var(--surface-2)"
            strokeWidth={2}
          />
        ))}
      </svg>
      <ol className="rb__steps" style={{ gridTemplateColumns: `repeat(${journey.length}, 1fr)` }}>
        {journey.map((j) => (
          <li key={j.step}>
            <span className="rb__step-name">{j.step}</span>
            <span className={`rb__feeling rb__feeling--${j.feeling}`}>
              {FEELING_LABEL[j.feeling]}
            </span>
            {j.pain && (
              <span className="rb__pain">
                <span aria-hidden="true">▲ </span>
                {j.pain}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
