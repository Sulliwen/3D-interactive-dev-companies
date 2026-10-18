import { useEffect, useMemo } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import type { ScreenComponentProps } from '../types'
import { levelEditorPropsSchema, type LevelEditorProps } from './schema'
import './level-editor.css'

/** Vue de dessus (px CSS). */
const MAP_W = 470
const MAP_H = 330
const px = (x: number) => (x / 100) * MAP_W
const py = (y: number) => (y / 100) * MAP_H

/** « Lanterne Editor » : éditeur de niveaux fictif. Vue de dessus, scène, inspecteur. */
export function LevelEditorScreen({ toolName, props: raw }: ScreenComponentProps) {
  const props = useMemo(() => levelEditorPropsSchema.parse(raw), [raw])
  const { revealZone, zoneRevealed } = useAnnotations()
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  return (
    <AppWindow
      toolName={toolName}
      title={props.scene}
      titleRight={<span className="le__play">▶ Jouer depuis ici</span>}
      status={
        <>
          <span>Affichage : {props.viewMode}</span>
          <span style={{ marginLeft: 'auto' }}>Enregistré dans Coffre · il y a 4 min</span>
        </>
      }
    >
      <Zone id="hierarchy" className="le__hierarchy">
        <p className="le__heading">Scène</p>
        <ul>
          {props.hierarchy.map((h) => (
            <li
              key={h.name}
              className={h.selected ? 'is-selected' : ''}
              style={{ paddingLeft: 10 + h.depth * 12 }}
            >
              {h.depth === 0 ? '▾ ' : ''}
              {h.name}
            </li>
          ))}
        </ul>
      </Zone>

      <div className="le__center">
        <Zone id="map" className="le__viewport">
          <span className="le__view-tag">Vue de dessus</span>
          <TopDown map={props.map} />
        </Zone>
        <Zone id="path" className="le__beats">
          <p className="le__heading">Chemin critique</p>
          <ol>
            {props.map.beats.map((b, i) => (
              <li key={b.label}>
                <i>{i + 1}</i>
                {b.label}
              </li>
            ))}
          </ol>
        </Zone>
      </div>

      <div className="le__side">
        <Zone id="inspector" className="le__panel">
          <p className="le__heading">Inspecteur</p>
          <p className="le__object">{props.inspector.name}</p>
          <dl className="le__fields">
            {props.inspector.fields.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </Zone>
        <div className="le__panel le__preview" aria-hidden="true">
          <p className="le__heading">Aperçu 3D</p>
          <Greybox />
        </div>
        <Zone id="stats" className="le__panel">
          <p className="le__heading">Mesures du niveau</p>
          <dl className="le__stats">
            {props.stats.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </Zone>
      </div>
    </AppWindow>
  )
}

function TopDown({ map }: { map: LevelEditorProps['map'] }) {
  const [dx, dy, dw, dh] = map.danger.rect
  const path = map.path.map(([x, y], i) => `${i ? 'L' : 'M'}${px(x)} ${py(y)}`).join(' ')
  return (
    <svg width={MAP_W} height={MAP_H} role="img" aria-label="Vue de dessus du niveau">
      <defs>
        <pattern id="le-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="#2a3140" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={MAP_W} height={MAP_H} fill="#1d2330" />
      {/* La côte : la mer à droite et en bas. */}
      <path
        d={`M0 0 H${MAP_W * 0.82} C ${MAP_W * 0.9} ${MAP_H * 0.3}, ${MAP_W * 0.74} ${MAP_H * 0.62}, ${MAP_W * 0.86} ${MAP_H} H0 Z`}
        fill="#2a3242"
      />
      <rect width={MAP_W} height={MAP_H} fill="url(#le-grid)" />
      <rect x={px(dx)} y={py(dy)} width={px(dw)} height={py(dh)} className="le__danger" />
      <text x={px(dx) + 4} y={py(dy) + 12} className="le__danger-label">
        {map.danger.label}
      </text>
      {map.blocks.map(([x, y, w, h], i) => (
        <rect key={i} x={px(x)} y={py(y)} width={px(w)} height={py(h)} className="le__block" />
      ))}
      <path d={path} className="le__path" />
      {map.lamps.map((l) => (
        <g key={l.label} transform={`translate(${px(l.at[0])} ${py(l.at[1])})`}>
          <circle r="16" className="le__lamp-radius" />
          <circle r="5" className="le__lamp" />
          <text x="9" y="-7" className="le__label">
            {l.label}
          </text>
        </g>
      ))}
      {map.beats.map((b, i) => (
        <g key={b.label} transform={`translate(${px(b.at[0])} ${py(b.at[1])})`}>
          <circle r="8" className="le__beat" />
          <text y="3.5" textAnchor="middle" className="le__beat-n">
            {i + 1}
          </text>
        </g>
      ))}
      <g transform={`translate(${px(map.landmark.at[0])} ${py(map.landmark.at[1])})`}>
        <circle r="26" className="le__sight" />
        <path d="M-5 8 L-3 -12 L3 -12 L5 8 Z" className="le__tower" />
        <text
          x={map.landmark.at[0] > 60 ? -12 : 10}
          y="-8"
          textAnchor={map.landmark.at[0] > 60 ? 'end' : 'start'}
          className="le__label le__label--landmark"
        >
          {map.landmark.label}
        </text>
      </g>
    </svg>
  )
}

/** Petite vue 3D en blocs gris (isométrique), décorative. */
function Greybox() {
  const iso = (x: number, y: number, z: number) =>
    `${120 + (x - y) * 14},${70 + (x + y) * 7 - z * 14}`
  const box = (x: number, y: number, w: number, d: number, h: number, key: string) => {
    const top = [iso(x, y, h), iso(x + w, y, h), iso(x + w, y + d, h), iso(x, y + d, h)].join(' ')
    const left = [
      iso(x, y + d, 0),
      iso(x + w, y + d, 0),
      iso(x + w, y + d, h),
      iso(x, y + d, h),
    ].join(' ')
    const right = [
      iso(x + w, y, 0),
      iso(x + w, y + d, 0),
      iso(x + w, y + d, h),
      iso(x + w, y, h),
    ].join(' ')
    return (
      <g key={key}>
        <polygon points={left} fill="#5b6270" />
        <polygon points={right} fill="#737a88" />
        <polygon points={top} fill="#9aa0ab" />
      </g>
    )
  }
  return (
    <svg width="236" height="112" viewBox="0 0 240 112">
      {box(-3, -1, 2, 2, 1.2, 'a')}
      {box(0, -2, 2, 1.5, 1.6, 'b')}
      {box(-1, 2, 1.5, 1.5, 1, 'c')}
      {box(3, 0, 1, 1, 4.4, 'phare')}
    </svg>
  )
}
