import { useEffect, useMemo } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import type { ScreenComponentProps } from '../types'
import { modelingViewportPropsSchema } from './schema'
import './modeling-viewport.css'

const fmt = (n: number) => n.toLocaleString('fr-FR')

/** « Atelier 3D » : outil de modélisation fictif. Modèle en fil de fer, budget, LOD, textures. */
export function ModelingViewportScreen({ toolName, props: raw }: ScreenComponentProps) {
  const props = useMemo(() => modelingViewportPropsSchema.parse(raw), [raw])
  const { revealZone, zoneRevealed } = useAnnotations()
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const { current, budget } = props.triangles
  const ratio = current / budget
  const ok = ratio <= 1

  return (
    <AppWindow
      toolName={toolName}
      title={props.file}
      titleRight={<span>Fil de fer + ombré</span>}
      status={
        <>
          <span>Objet : {props.object}</span>
          <span style={{ marginLeft: 'auto' }}>Unités : mètres · export vers Lanterne Editor</span>
        </>
      }
    >
      <div className="mv__main">
        <Zone id="viewport" className="mv__viewport">
          <span className="mv__view-tag">Perspective</span>
          <Lighthouse rings={12} segments={10} />
          <p className="mv__ref">
            <b>Référence (Mei) :</b> {props.reference}
          </p>
          <span className="mv__gizmo" aria-hidden="true">
            <i className="x">X</i>
            <i className="y">Y</i>
            <i className="z">Z</i>
          </span>
        </Zone>
        <Zone id="kit" className="mv__kit">
          <p className="mv__heading">Kit modulaire du village</p>
          <ul>
            {props.kit.map((k) => (
              <li key={k.name}>
                <span className="mv__piece" aria-hidden="true" />
                <span>{k.name}</span>
                <b>× {k.uses}</b>
              </li>
            ))}
          </ul>
        </Zone>
      </div>

      <div className="mv__side">
        <Zone id="budget" className="mv__panel">
          <p className="mv__heading">Budget de triangles</p>
          <p className="mv__count">
            {fmt(current)} <span>/ {fmt(budget)}</span>
          </p>
          <span className="mv__bar">
            <span
              className={ok ? 'is-ok' : 'is-over'}
              style={{ width: `${Math.min(100, ratio * 100)}%` }}
            />
          </span>
          <p className={`mv__verdict ${ok ? 'is-ok' : 'is-over'}`}>
            {ok ? '✓ Dans le budget' : '✗ Hors budget'} · {Math.round(ratio * 100)} %
          </p>
        </Zone>

        <Zone id="lods" className="mv__panel">
          <p className="mv__heading">Niveaux de détail (LOD)</p>
          <ul className="mv__lods">
            {props.lods.map((l, i) => (
              <li key={l.name}>
                <Lighthouse rings={[12, 6, 3, 2][i] ?? 2} segments={[10, 6, 4, 3][i] ?? 3} small />
                <span>
                  <b>{l.name}</b>
                  {fmt(l.triangles)} triangles
                  <em>{l.distance}</em>
                </span>
              </li>
            ))}
          </ul>
        </Zone>

        <Zone id="textures" className="mv__panel">
          <p className="mv__heading">Textures</p>
          <ul className="mv__textures">
            {props.textures.map((t) => (
              <li key={t.slot}>
                <span className="mv__tex" style={{ background: t.color }} aria-hidden="true" />
                <span>{t.slot}</span>
                <b>{t.size}</b>
              </li>
            ))}
          </ul>
        </Zone>
      </div>
    </AppWindow>
  )
}

/**
 * Le phare en fil de fer : un tronc de cône découpé en anneaux et en segments, une
 * galerie et la lanterne. Plus d'anneaux = plus de triangles.
 */
function Lighthouse({
  rings,
  segments,
  small,
}: {
  rings: number
  segments: number
  small?: boolean
}) {
  const w = small ? 46 : 360
  const h = small ? 62 : 330
  const cx = 180
  const base = { y: 300, r: 62 }
  const top = { y: 90, r: 38 }
  const ry = (r: number) => r * 0.22
  const lines: string[] = []
  for (let i = 0; i <= rings; i++) {
    const t = i / rings
    const y = base.y + (top.y - base.y) * t
    const r = base.r + (top.r - base.r) * t
    lines.push(`M${cx - r} ${y} A ${r} ${ry(r)} 0 0 0 ${cx + r} ${y}`)
  }
  for (let j = 0; j <= segments; j++) {
    const a = Math.PI * (j / segments)
    const cos = -Math.cos(a)
    const sin = Math.sin(a)
    lines.push(
      `M${cx + base.r * cos} ${base.y + ry(base.r) * sin} L${cx + top.r * cos} ${top.y + ry(top.r) * sin}`,
    )
  }
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 360 330"
      aria-hidden="true"
      className={`mv__model ${small ? 'mv__model--small' : ''}`}
    >
      <ellipse cx={cx} cy={base.y} rx={base.r + 30} ry={ry(base.r + 30)} className="mv__ground" />
      <path
        d={`M${cx - base.r} ${base.y} L${cx - top.r} ${top.y} L${cx + top.r} ${top.y} L${cx + base.r} ${base.y} Z`}
        className="mv__shade"
      />
      <path d={lines.join(' ')} className="mv__wire" />
      {/* Galerie, lanterne, toit. */}
      <ellipse cx={cx} cy={top.y} rx={top.r + 12} ry={ry(top.r + 12)} className="mv__wire" />
      <rect x={cx - 24} y={top.y - 42} width="48" height="42" className="mv__wire mv__glass" />
      <path
        d={`M${cx - 30} ${top.y - 42} L${cx} ${top.y - 70} L${cx + 30} ${top.y - 42} Z`}
        className="mv__wire"
      />
      {!small && <circle cx={cx} cy={top.y - 21} r="4" className="mv__pivot" />}
    </svg>
  )
}
