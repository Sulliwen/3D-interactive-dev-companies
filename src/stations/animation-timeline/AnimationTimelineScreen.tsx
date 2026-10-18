import { useEffect, useMemo } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import type { ScreenComponentProps } from '../types'
import { animationTimelinePropsSchema, type AnimationTimelineProps, type PoseKind } from './schema'
import './animation-timeline.css'

/** « Squelette » : outil d'animation fictif. Poses clés, feuille d'exposition, courbes. */
export function AnimationTimelineScreen({ toolName, props: raw }: ScreenComponentProps) {
  const props = useMemo(() => animationTimelinePropsSchema.parse(raw), [raw])
  const { revealZone, zoneRevealed } = useAnnotations()
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const { clip, playhead } = props
  const seconds = (clip.frames / clip.fps).toLocaleString('fr-FR', { maximumFractionDigits: 2 })
  const current = [...props.keys].reverse().find((k) => k.frame <= playhead) ?? props.keys[0]!

  return (
    <AppWindow
      toolName={toolName}
      title={props.file}
      titleRight={
        <span>
          Image {playhead} / {clip.frames}
        </span>
      }
      status={
        <>
          <span>Squelette : Maëlle_rig · 64 os</span>
          <span style={{ marginLeft: 'auto' }}>Export vers Lanterne Editor</span>
        </>
      }
    >
      <div className="at">
        <div className="at__top">
          <Zone id="poses" className="at__poses">
            <span className="at__view-tag">Poses clés · pelure d'oignon</span>
            {props.keys.map((k) => (
              <figure key={k.frame} className={k === current ? 'is-current' : ''}>
                <Figure pose={k.pose} />
                <figcaption>
                  <b>{k.frame}</b> {k.label}
                </figcaption>
              </figure>
            ))}
          </Zone>
          <div className="at__side">
            <Zone id="clip" className="at__panel">
              <p className="at__heading">Animation</p>
              <p className="at__clip">{clip.name}</p>
              <p className="at__meta">
                {clip.frames} images · {clip.fps} i/s · {seconds} s
              </p>
            </Zone>
            <Zone id="transition" className="at__panel">
              <p className="at__heading">Raccord</p>
              <p className="at__blend">
                → {props.transition.to} <span>fondu de {props.transition.blendFrames} images</span>
              </p>
              <p className="at__note">{props.transition.note}</p>
            </Zone>
          </div>
        </div>

        <div className="at__bottom">
          <Zone id="dopesheet" className="at__panel at__dopesheet">
            <p className="at__heading">Feuille d'exposition</p>
            <DopeSheet props={props} />
          </Zone>
          <Zone id="curve" className="at__panel at__curve">
            <p className="at__heading">Courbe · {props.curve.label}</p>
            <Curve props={props} />
            <p className="at__note">{props.curve.note}</p>
          </Zone>
        </div>
      </div>
    </AppWindow>
  )
}

function DopeSheet({ props }: { props: AnimationTimelineProps }) {
  const { frames } = props.clip
  const W = 440
  const LABEL = 92
  const x = (f: number) => LABEL + (f / frames) * (W - LABEL - 8)
  const ticks = Array.from({ length: Math.floor(frames / 6) + 1 }, (_, i) => i * 6)
  const h = 18 + props.tracks.length * 18
  return (
    <svg width={W} height={h} role="img" aria-label="Images clés par articulation">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1="12" y2={h} className="at__tick" />
          <text x={x(t)} y="9" textAnchor="middle" className="at__tick-label">
            {t}
          </text>
        </g>
      ))}
      {props.tracks.map((tr, i) => {
        const y = 24 + i * 18
        return (
          <g key={tr.name}>
            <text x="2" y={y + 4} className="at__track">
              {tr.name}
            </text>
            <line x1={LABEL} x2={W - 8} y1={y} y2={y} className="at__lane" />
            {tr.frames.map((f) => (
              <rect
                key={f}
                x={x(f) - 4}
                y={y - 4}
                width="8"
                height="8"
                transform={`rotate(45 ${x(f)} ${y})`}
                className="at__key"
              />
            ))}
          </g>
        )
      })}
      <line x1={x(props.playhead)} x2={x(props.playhead)} y1="12" y2={h} className="at__playhead" />
    </svg>
  )
}

function Curve({ props }: { props: AnimationTimelineProps }) {
  const W = 300
  const H = 120
  const pts = props.curve.points
  const values = pts.map((p) => p[1])
  const min = Math.min(...values, 0)
  const max = Math.max(...values)
  const x = (f: number) => 8 + (f / props.clip.frames) * (W - 16)
  const y = (v: number) => H - 10 - ((v - min) / (max - min || 1)) * (H - 20)
  // Courbe lissée (Catmull-Rom → Bézier) entre les clés.
  let d = `M${x(pts[0]![0])} ${y(pts[0]![1])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!
    const p1 = pts[i]!
    const p2 = pts[i + 1]!
    const p3 = pts[i + 2] ?? p2
    const c1 = [x(p1[0]) + (x(p2[0]) - x(p0[0])) / 6, y(p1[1]) + (y(p2[1]) - y(p0[1])) / 6]
    const c2 = [x(p2[0]) - (x(p3[0]) - x(p1[0])) / 6, y(p2[1]) - (y(p3[1]) - y(p1[1])) / 6]
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${x(p2[0])} ${y(p2[1])}`
  }
  return (
    <svg width={W} height={H} role="img" aria-label={`Courbe : ${props.curve.label}`}>
      <rect width={W} height={H} className="at__curve-bg" />
      <line x1="0" x2={W} y1={y(0)} y2={y(0)} className="at__tick" />
      <line x1={x(props.playhead)} x2={x(props.playhead)} y1="0" y2={H} className="at__playhead" />
      <path d={d} className="at__curve-line" />
      {pts.map(([f, v]) => (
        <circle key={f} cx={x(f)} cy={y(v)} r="3.5" className="at__curve-key" />
      ))}
    </svg>
  )
}

/** Paramètres de chaque pose : inclinaison du buste, flexion des genoux, angle du bras. */
const POSES: Record<PoseKind, { lean: number; crouch: number; arm: number; glow: number }> = {
  rest: { lean: 0, crouch: 0, arm: 12, glow: 0.2 },
  anticipation: { lean: 12, crouch: 0.45, arm: -18, glow: 0.2 },
  raise: { lean: -8, crouch: 0.05, arm: 150, glow: 0.8 },
  overshoot: { lean: -12, crouch: 0, arm: 172, glow: 1 },
  settle: { lean: -4, crouch: 0.12, arm: 158, glow: 0.9 },
}

/** Silhouette de Maëlle (vue de profil) dans une pose donnée. */
function Figure({ pose }: { pose: PoseKind }) {
  const p = POSES[pose]
  const rad = (deg: number) => (deg * Math.PI) / 180
  const hip = { x: 50, y: 98 + p.crouch * 18 }
  const shoulder = { x: hip.x + Math.sin(rad(p.lean)) * 44, y: hip.y - Math.cos(rad(p.lean)) * 44 }
  const head = { x: shoulder.x + Math.sin(rad(p.lean)) * 14, y: shoulder.y - 14 }
  const hand = {
    x: shoulder.x + Math.sin(rad(p.arm)) * 36,
    y: shoulder.y + Math.cos(rad(p.arm)) * 36,
  }
  const knee = { x: hip.x + 6 + p.crouch * 16, y: hip.y + 26 - p.crouch * 6 }
  return (
    <svg width="100" height="150" viewBox="0 0 100 150" aria-hidden="true">
      <circle
        cx={hand.x}
        cy={hand.y + 8}
        r={10 + p.glow * 16}
        fill="#ffd27a"
        opacity={0.15 + p.glow * 0.3}
      />
      <g className="at__body">
        <line x1={hip.x} y1={hip.y} x2={knee.x} y2={knee.y} />
        <line x1={knee.x} y1={knee.y} x2={hip.x} y2="146" />
        <line x1={hip.x} y1={hip.y} x2={hip.x - 8} y2="146" />
        <line x1={hip.x} y1={hip.y} x2={shoulder.x} y2={shoulder.y} className="at__spine" />
        <line x1={shoulder.x} y1={shoulder.y} x2={hand.x} y2={hand.y} />
        <circle cx={head.x} cy={head.y} r="9" className="at__head" />
      </g>
      {/* La lanterne pend sous la main. */}
      <line
        x1={hand.x}
        y1={hand.y}
        x2={hand.x}
        y2={hand.y + 5}
        stroke="#c9a77c"
        strokeWidth="1.5"
      />
      <rect x={hand.x - 4} y={hand.y + 5} width="8" height="9" rx="1.5" fill="#ffd27a" />
      <circle cx={hip.x} cy={hip.y} r="2.5" className="at__joint" />
      <circle cx={shoulder.x} cy={shoulder.y} r="2.5" className="at__joint" />
      <circle cx={knee.x} cy={knee.y} r="2.5" className="at__joint" />
    </svg>
  )
}
