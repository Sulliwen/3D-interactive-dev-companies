import { useEffect, useMemo, useState } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { StatusBadge } from '../common/charts'
import type { ScreenComponentProps } from '../types'
import { nodeGraphPropsSchema, type NodeGraphProps } from './schema'
import './node-graph.css'

type GraphNode = NodeGraphProps['nodes'][number]

/** Géométrie des nœuds, en pixels du canevas. */
const NODE_W = 136
const HEAD_H = 22
const ROW_H = 17
const ZONE_PAD = 8

const ms = (v: number) => `${v.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ms`

function nodeHeight(n: GraphNode): number {
  const rows = Math.max(n.inputs.length, n.outputs.length)
  return HEAD_H + 6 + rows * ROW_H + (n.value ? ROW_H : 0) + (n.cost ? 18 : 0) + 4
}

const portY = (n: GraphNode, i: number) => n.y + HEAD_H + 6 + i * ROW_H + ROW_H / 2

/**
 * Éditeur de shader fictif (graphe de nœuds) : chaque nœud est une petite opération sur
 * l'image (bruit, profondeur, mélange…), reliée aux autres ; le résultat est calculé pour
 * chaque pixel, à chaque image. À droite : l'aperçu, le coût et les paramètres partagés.
 */
export function NodeGraphScreen({ toolName, props: rawProps }: ScreenComponentProps) {
  const props = useMemo(() => nodeGraphPropsSchema.parse(rawProps), [rawProps])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  const [hover, setHover] = useState<string | null>(null)

  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const byId = useMemo(() => new Map(props.nodes.map((n) => [n.id, n])), [props.nodes])

  // Cadres des zones : l'enveloppe des nœuds qui partagent une même zone.
  const zones = useMemo(() => {
    const boxes = new Map<string, { x0: number; y0: number; x1: number; y1: number }>()
    for (const n of props.nodes) {
      if (!n.zone) continue
      const b = boxes.get(n.zone)
      const box = { x0: n.x, y0: n.y, x1: n.x + NODE_W, y1: n.y + nodeHeight(n) }
      boxes.set(
        n.zone,
        b
          ? {
              x0: Math.min(b.x0, box.x0),
              y0: Math.min(b.y0, box.y0),
              x1: Math.max(b.x1, box.x1),
              y1: Math.max(b.y1, box.y1),
            }
          : box,
      )
    }
    return [...boxes.entries()]
  }, [props.nodes])

  const { cost } = props
  const scale = Math.max(cost.budget * 1.3, cost.before.ms, cost.after.ms)
  const overBefore = cost.before.ms > cost.budget
  const overAfter = cost.after.ms > cost.budget

  return (
    <AppWindow
      toolName={toolName}
      title={props.title}
      titleRight={<span className="ng__compiled">● Compilé</span>}
      status={
        props.statusItems.length > 0 ? (
          <>
            {props.statusItems.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </>
        ) : undefined
      }
    >
      <div className="ng">
        <div className="ng__canvas">
          <div className="ng__toolbar" aria-hidden="true">
            <span>Graphe</span>
            <span className="ng__toolbar-muted">Clic sur un nœud : ses liens s'allument</span>
          </div>
          <div className="ng__board">
            {zones.map(([id, b]) => (
              <div
                key={id}
                className="ng__zone-box"
                style={{
                  left: b.x0 - ZONE_PAD,
                  top: b.y0 - ZONE_PAD,
                  width: b.x1 - b.x0 + ZONE_PAD * 2,
                  height: b.y1 - b.y0 + ZONE_PAD * 2,
                }}
              >
                <Zone id={id} className="ng__zone">
                  <span />
                </Zone>
              </div>
            ))}

            <svg className="ng__links" aria-hidden="true">
              {props.links.map((l, i) => {
                const a = byId.get(l.from)
                const b = byId.get(l.to)
                if (!a || !b) return null
                const x1 = a.x + NODE_W
                const y1 = portY(a, l.fromPort)
                const x2 = b.x
                const y2 = portY(b, l.toPort)
                const dx = Math.max(40, Math.abs(x2 - x1) / 2)
                const lit = hover === a.id || hover === b.id
                const dead = a.removed || b.removed
                return (
                  <path
                    key={i}
                    d={`M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`}
                    className={`ng__link ${lit ? 'is-lit' : ''} ${dead ? 'is-dead' : ''}`}
                  />
                )
              })}
            </svg>

            {props.nodes.map((n) => (
              <div
                key={n.id}
                className={`ng__node ng__node--${n.kind} ${n.removed ? 'is-removed' : ''} ${
                  hover === n.id ? 'is-lit' : ''
                }`}
                style={{ left: n.x, top: n.y, width: NODE_W }}
                onMouseEnter={live ? () => setHover(n.id) : undefined}
                onMouseLeave={live ? () => setHover(null) : undefined}
              >
                <p className="ng__node-title">{n.title}</p>
                <div className="ng__ports">
                  <ul>
                    {n.inputs.map((p) => (
                      <li key={p}>
                        <i aria-hidden="true" /> {p}
                      </li>
                    ))}
                  </ul>
                  <ul className="ng__outputs">
                    {n.outputs.map((p) => (
                      <li key={p}>
                        {p} <i aria-hidden="true" />
                      </li>
                    ))}
                  </ul>
                </div>
                {n.value && <p className="ng__value">{n.value}</p>}
                {n.cost && <p className="ng__cost">{n.removed ? `retiré · ${n.cost}` : n.cost}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="ng__side">
          <Zone id="preview" className="ng__panel">
            <p className="ng__panel-title">{props.preview.title}</p>
            <FogPreview />
            <p className="ng__muted">{props.preview.caption}</p>
          </Zone>

          <Zone id="cost" className="ng__panel">
            <p className="ng__panel-title">{cost.title}</p>
            {[
              { ...cost.before, over: overBefore },
              { ...cost.after, over: overAfter },
            ].map((c) => (
              <div key={c.label} className="ng__cost-row">
                <span className="ng__cost-label">{c.label}</span>
                <span className="ng__bar">
                  <span
                    className={`ng__bar-fill ${c.over ? 'is-over' : ''}`}
                    style={{ width: `${(c.ms / scale) * 100}%` }}
                  />
                  <span
                    className="ng__budget"
                    style={{ left: `${(cost.budget / scale) * 100}%` }}
                    aria-hidden="true"
                  />
                </span>
                <StatusBadge status={c.over ? 'serious' : 'good'}>{ms(c.ms)}</StatusBadge>
              </div>
            ))}
            <p className="ng__muted">
              Budget de l'effet : {ms(cost.budget)} par image. {cost.note}
            </p>
          </Zone>

          <Zone id="parameters" className="ng__panel ng__params">
            <p className="ng__panel-title">Paramètres partagés avec le jeu</p>
            <ul>
              {props.parameters.map((p) => (
                <li key={p.name}>
                  <code>{p.name}</code>
                  <span className="ng__param-value">{p.value}</span>
                  <span className="ng__muted">{p.note}</span>
                </li>
              ))}
            </ul>
          </Zone>
        </div>
      </div>
    </AppWindow>
  )
}

/** Aperçu dessiné : le phare dans la brume, et le trou de lumière autour de la lanterne. */
function FogPreview() {
  return (
    <svg className="ng__preview" viewBox="0 0 300 140" role="img" aria-label="Aperçu de la brume">
      <defs>
        <linearGradient id="ng-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#24344a" />
          <stop offset="1" stopColor="#5b6f83" />
        </linearGradient>
        <radialGradient id="ng-hole">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.55" stopColor="#000" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" />
        </radialGradient>
        <radialGradient id="ng-glow">
          <stop offset="0" stopColor="#ffd38a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f2a541" stopOpacity="0" />
        </radialGradient>
        <mask id="ng-fog-mask">
          <rect width="300" height="140" fill="#fff" />
          <circle cx="104" cy="104" r="44" fill="url(#ng-hole)" />
        </mask>
        <filter id="ng-blur">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <rect width="300" height="140" fill="url(#ng-sky)" />
      <rect y="96" width="300" height="44" fill="#2c3b49" />
      {/* Falaise et phare */}
      <path d="M170 140 L182 92 L232 84 L262 96 L300 92 L300 140 Z" fill="#1d2731" />
      <rect x="226" y="40" width="12" height="46" fill="#cfd3d6" />
      <rect x="226" y="52" width="12" height="6" fill="#b5503e" />
      <rect x="226" y="68" width="12" height="6" fill="#b5503e" />
      <path d="M224 40 L232 30 L240 40 Z" fill="#1d2731" />
      {/* Maëlle et sa lanterne */}
      <circle cx="104" cy="104" r="26" fill="url(#ng-glow)" />
      <rect x="100" y="100" width="5" height="16" rx="2" fill="#14191f" />
      <circle cx="102.5" cy="97" r="3" fill="#14191f" />
      <circle cx="108" cy="102" r="2.2" fill="#ffd38a" />
      {/* La brume, percée autour de la lanterne */}
      <g mask="url(#ng-fog-mask)" filter="url(#ng-blur)" className="ng__fog">
        <ellipse cx="60" cy="100" rx="90" ry="26" fill="#dfe6ea" opacity="0.75" />
        <ellipse cx="170" cy="92" rx="110" ry="30" fill="#e8edf0" opacity="0.7" />
        <ellipse cx="270" cy="104" rx="80" ry="24" fill="#dfe6ea" opacity="0.6" />
        <ellipse cx="130" cy="60" rx="120" ry="18" fill="#cdd6dc" opacity="0.35" />
      </g>
    </svg>
  )
}
