import { useEffect, useMemo, useState } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import type { ScreenComponentProps } from '../types'
import { dialogueGraphPropsSchema, type DialogueGraphProps } from './schema'
import './dialogue-graph.css'

const NODE_W = 140
const NODE_H = 58

const KIND_LABEL = {
  line: 'Réplique',
  choice: 'Choix du joueur',
  condition: 'Condition',
  event: 'Événement',
} as const

type GraphNode = DialogueGraphProps['nodes'][number]

/**
 * « Fil d'histoire » : un dialogue à embranchements dessiné comme un graphe (répliques,
 * choix du joueur, conditions), avec l'inspecteur du nœud sélectionné et l'avancement
 * de l'enregistrement des voix.
 */
export function DialogueGraphScreen({ toolName, props: raw }: ScreenComponentProps) {
  const p = useMemo(() => dialogueGraphPropsSchema.parse(raw), [raw])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  const [selected, setSelected] = useState(p.selected)
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const byId = new Map(p.nodes.map((n) => [n.id, n]))
  const current = byId.get(selected) ?? p.nodes[0]!
  const progress = Math.round((p.recording.written / p.recording.lines) * 100)

  return (
    <AppWindow
      toolName={toolName}
      title={p.scene}
      status={
        <>
          <span>{p.status}</span>
          <span style={{ marginLeft: 'auto' }}>
            {p.nodes.length} nœuds · {p.edges.length} liens
          </span>
        </>
      }
    >
      <div className="dg">
        <Zone id="graph" className="dg__canvas">
          <svg className="dg__edges" width={690} height={450} aria-hidden="true">
            <defs>
              <marker
                id="dg-arrow"
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="7"
                markerHeight="7"
                orient="auto"
              >
                <path d="M0 0L8 4L0 8z" fill="#5d6884" />
              </marker>
            </defs>
            {p.edges.map((e) => {
              const a = byId.get(e.from)
              const b = byId.get(e.to)
              if (!a || !b) return null
              // Même colonne : du bas d'un nœud vers le haut du suivant ; sinon, de gauche à droite.
              const below = b.x <= a.x
              const x1 = below ? a.x + NODE_W / 2 : a.x + NODE_W
              const y1 = below ? a.y + NODE_H : a.y + NODE_H / 2
              const x2 = below ? b.x + NODE_W / 2 : b.x
              const y2 = below ? b.y : b.y + NODE_H / 2
              const dx = Math.max(30, (x2 - x1) / 2)
              const d = below
                ? `M${x1} ${y1} L${x2} ${y2}`
                : `M${x1} ${y1} C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`
              return (
                <g key={`${e.from}-${e.to}`}>
                  <path d={d} className="dg__edge" markerEnd="url(#dg-arrow)" />
                  {e.label && (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 5}
                      textAnchor="middle"
                      className="dg__edge-label"
                    >
                      {e.label}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
          {p.nodes.map((n) => (
            <GraphNodeBox
              key={n.id}
              node={n}
              active={n.id === current.id}
              live={live}
              onSelect={() => setSelected(n.id)}
            />
          ))}
        </Zone>

        <div className="dg__side">
          <Zone id="inspector" className="dg__panel dg__inspector">
            <p className="dg__heading">Inspecteur · {KIND_LABEL[current.kind]}</p>
            {current.speaker && <p className="dg__speaker">{current.speaker}</p>}
            <p className="dg__full">{current.text}</p>
            {current.voice ? (
              <dl className="dg__voice">
                <dt>Fichier voix</dt>
                <dd className="dg__mono">{current.voice.id}</dd>
                <dt>Jeu demandé</dt>
                <dd>{current.voice.direction}</dd>
                <dt>Durée</dt>
                <dd>{current.voice.duration}</dd>
              </dl>
            ) : (
              <p className="dg__muted">Pas de voix enregistrée pour ce nœud.</p>
            )}
            {p.variables.length > 0 && (
              <>
                <p className="dg__heading dg__heading--small">Variables de l'histoire</p>
                <ul className="dg__vars">
                  {p.variables.map((v) => (
                    <li key={v.name}>
                      <span className="dg__mono">{v.name}</span>
                      <span>{v.value}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Zone>

          <Zone id="recording" className="dg__panel dg__recording">
            <p className="dg__heading">Enregistrement des voix</p>
            <p>
              <strong>{p.recording.written}</strong> répliques écrites sur{' '}
              <strong>{p.recording.lines}</strong>
            </p>
            <span className="dg__bar" aria-hidden="true">
              <i style={{ width: `${progress}%` }} />
            </span>
            <p className="dg__muted">
              Studio : {p.recording.date} · {p.recording.actor}
            </p>
          </Zone>
        </div>
      </div>
    </AppWindow>
  )
}

function GraphNodeBox({
  node,
  active,
  live,
  onSelect,
}: {
  node: GraphNode
  active: boolean
  live: boolean
  onSelect: () => void
}) {
  const box = (
    <div
      className={`dg__node dg__node--${node.kind} ${node.zone ? 'dg__node--zoned' : ''} ${active ? 'is-active' : ''}`}
      role="button"
      tabIndex={live ? 0 : -1}
      aria-label={`${KIND_LABEL[node.kind]} : ${node.speaker ? `${node.speaker}, ` : ''}${node.text}`}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
    >
      <span className="dg__kind">
        {node.kind === 'line' ? node.speaker : KIND_LABEL[node.kind]}
        {node.voice && <i className="dg__mic" title="Voix enregistrée" />}
      </span>
      <span className="dg__text">{node.text}</span>
    </div>
  )
  return (
    <div className="dg__slot" style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H }}>
      {node.zone ? (
        <Zone id={node.zone} className="dg__zone">
          {box}
        </Zone>
      ) : (
        box
      )}
    </div>
  )
}
