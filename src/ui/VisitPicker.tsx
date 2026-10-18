import { useState } from 'react'
import { Carousel } from './Carousel'
import {
  findStructure,
  getVisit,
  structures,
  upcomingStructures,
  type VisitRef,
} from '../content/loader'
import { visitedCount } from '../state/progress'
import { useGameStore } from '../state/useGameStore'

/**
 * Choix de la visite en deux temps : le type de structure (le décor), puis le type de
 * développement que cette structure traite (le parcours).
 */
export function VisitPicker({
  current,
  onChoose,
}: {
  current: VisitRef | null
  onChoose: (ref: VisitRef) => void
}) {
  const [structureId, setStructureId] = useState<string | null>(null)
  const progress = useGameStore((s) => s.progress)
  const bundle = structureId ? findStructure(structureId) : undefined

  if (!bundle) {
    return (
      <div className="picker">
        <p className="picker__lead">
          <strong>1. Choisissez une structure.</strong> On ne fabrique pas un logiciel de la même
          façon dans une start-up, un studio de jeu vidéo ou un laboratoire : les lieux, les métiers
          et le rythme changent.
        </p>
        <Carousel label="Structures">
          {structures
            .filter((b) => b.scenarios.length > 0)
            .map(({ structure, scenarios }) => (
              <button
                key={structure.id}
                type="button"
                className={`picker__card ${current?.structure === structure.id ? 'is-current' : ''}`}
                onClick={() => setStructureId(structure.id)}
                data-autofocus={current?.structure === structure.id || undefined}
              >
                <p className="picker__kind">{structure.kind}</p>
                <p className="picker__title">{structure.name}</p>
                <p className="picker__summary">{structure.summary}</p>
                <ul className="picker__facts">
                  {structure.facts.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <span className="picker__meta">
                  {scenarios.length} type{scenarios.length > 1 ? 's' : ''} de développement →
                </span>
              </button>
            ))}
          {upcomingStructures.map((u) => (
            <button key={u.kind} type="button" className="picker__card" disabled>
              <p className="picker__kind">{u.kind}</p>
              <span className="picker__soon">En préparation</span>
              <p className="picker__summary">{u.summary}</p>
              <ul className="picker__facts">
                {u.scenarios.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </button>
          ))}
        </Carousel>
      </div>
    )
  }

  const { structure } = bundle
  return (
    <div className="picker">
      <button
        type="button"
        className="button button--ghost picker__back"
        onClick={() => setStructureId(null)}
      >
        ← Autres structures
      </button>
      <p className="picker__lead">
        <strong>2. Choisissez ce que l'équipe de {structure.name} est en train de faire.</strong>{' '}
        Selon le type de développement, ce ne sont pas les mêmes postes qui interviennent, ni dans
        le même ordre.
      </p>
      <Carousel label="Types de développement">
        {bundle.scenarios.map(({ scenario }) => {
          const ref = { structure: structure.id, scenario: scenario.id }
          const visit = getVisit(ref)
          const seen = visitedCount(
            progress[visit.key] ?? { visited: [] },
            visit.pathStations.map((s) => s.id),
          )
          const isCurrent =
            current?.structure === ref.structure && current.scenario === ref.scenario
          return (
            <button
              key={scenario.id}
              type="button"
              className={`picker__card ${isCurrent ? 'is-current' : ''}`}
              onClick={() => onChoose(ref)}
              data-autofocus={isCurrent || undefined}
            >
              <p className="picker__kind">{scenario.kind}</p>
              <p className="picker__title">{scenario.title}</p>
              <p className="picker__summary">{scenario.summary}</p>
              <span className="picker__meta">
                {visit.pathStations.length} étapes
                {seen > 0 && ` · ${seen} déjà vue${seen > 1 ? 's' : ''}`}
                {isCurrent && ' · visite en cours'}
              </span>
            </button>
          )
        })}
      </Carousel>
    </div>
  )
}
