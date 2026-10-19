import { useEffect, useMemo, useState } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import type { ScreenComponentProps } from '../types'
import { audioMixerPropsSchema, toDb, volumeAt, type AudioMixerProps } from './schema'
import './audio-mixer.css'

const CURVE_W = 360
const CURVE_H = 120
const WAVE_W = 300
const WAVE_H = 30
const SAMPLES = 90

/** Forme d'onde stable pour un fichier (pas de vrai son : un dessin déterministe). */
function waveform(seed: string): number[] {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const rand = () => {
    h = (h * 1664525 + 1013904223) >>> 0
    return h / 2 ** 32
  }
  const out: number[] = []
  let env = 0.5
  for (let i = 0; i < SAMPLES; i++) {
    env += (rand() - 0.5) * 0.25
    env = Math.min(1, Math.max(0.2, env))
    out.push(env * (0.55 + rand() * 0.45))
  }
  return out
}

/**
 * Outil de son interactif fictif : un évènement sonore fait de plusieurs couches, dont le
 * volume suit un paramètre envoyé par le jeu (ici, la densité de brume autour de Maëlle).
 * En direct, le curseur du paramètre se manipule et les couches se mélangent en conséquence.
 */
export function AudioMixerScreen({ toolName, props: rawProps }: ScreenComponentProps) {
  const props = useMemo(() => audioMixerPropsSchema.parse(rawProps), [rawProps])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  const [value, setValue] = useState(props.parameter.value)

  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const waves = useMemo(() => props.layers.map((l) => waveform(l.file)), [props.layers])
  const volumes = props.layers.map((l) => volumeAt(l.curve, value))
  const percent = Math.round(value * 100)

  const cx = (x: number) => 8 + x * (CURVE_W - 16)
  const cy = (y: number) => CURVE_H - 14 - y * (CURVE_H - 24)

  return (
    <AppWindow
      toolName={toolName}
      title={props.title}
      titleRight={<span className="am__live">▶ Lecture en direct depuis le jeu</span>}
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
      <div className={`am ${props.accessibility ? 'has-access' : ''}`}>
        <div className="am__left">
          <Zone id="events" className="am__panel am__events">
            <p className="am__panel-title">Évènements sonores</p>
            <ul>
              {props.events.map((e) => (
                <li key={e.name} className={e.active ? 'is-active' : ''}>
                  <code>{e.name}</code>
                  <span>{e.note}</span>
                </li>
              ))}
            </ul>
          </Zone>
          <Zone id="music" className="am__panel">
            <p className="am__panel-title">Musique</p>
            <p className="am__music-title">♪ {props.music.title}</p>
            <p className="am__muted">{props.music.composer}</p>
            <p className="am__note">{props.music.note}</p>
          </Zone>
        </div>

        <div className="am__center">
          <Zone id="parameter" className="am__panel">
            <p className="am__panel-title">
              Paramètre de jeu : {props.parameter.name} · {percent} %
            </p>
            <div className="am__param">
              <svg width={CURVE_W} height={CURVE_H} role="img" aria-label="Courbes de volume">
                <line className="am__axis" x1={8} x2={CURVE_W - 8} y1={cy(0)} y2={cy(0)} />
                {props.layers.map((l, i) => (
                  <polyline
                    key={l.name}
                    className={`am__curve am__curve--${i + 1}`}
                    points={[...l.curve]
                      .sort((a, b) => a[0] - b[0])
                      .map(([x, y]) => `${cx(x)},${cy(y)}`)
                      .join(' ')}
                  />
                ))}
                <line className="am__cursor" x1={cx(value)} x2={cx(value)} y1={4} y2={cy(0)} />
                {props.layers.map((l, i) => (
                  <circle
                    key={l.name}
                    className={`am__dot am__dot--${i + 1}`}
                    cx={cx(value)}
                    cy={cy(volumes[i]!)}
                    r={4}
                  />
                ))}
                <text className="am__tick" x={8} y={CURVE_H - 1}>
                  {props.parameter.minLabel}
                </text>
                <text className="am__tick" x={CURVE_W - 8} y={CURVE_H - 1} textAnchor="end">
                  {props.parameter.maxLabel}
                </text>
              </svg>
              <input
                type="range"
                className="am__slider"
                min={0}
                max={100}
                value={percent}
                disabled={!live}
                tabIndex={live ? 0 : -1}
                aria-label={props.parameter.name}
                onChange={(e) => setValue(Number(e.target.value) / 100)}
              />
              <p className="am__muted">{props.parameter.source}</p>
            </div>
          </Zone>

          <Zone id="layers" className="am__panel am__layers">
            <p className="am__panel-title">Couches de l'évènement</p>
            {props.layers.map((l, i) => {
              const v = volumes[i]!
              return (
                <div key={l.name} className="am__track">
                  <div className="am__track-name">
                    <i className={`am__swatch am__swatch--${i + 1}`} aria-hidden="true" />
                    <span>
                      {l.name}
                      <span className="am__file">{l.file}</span>
                    </span>
                  </div>
                  <svg
                    width={WAVE_W}
                    height={WAVE_H}
                    viewBox={`0 0 ${WAVE_W} ${WAVE_H}`}
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    {waves[i]!.map((a, k) => {
                      const h = Math.max(1, a * v * (WAVE_H - 2))
                      return (
                        <rect
                          key={k}
                          className={`am__wave am__wave--${i + 1}`}
                          x={(k * WAVE_W) / SAMPLES}
                          y={(WAVE_H - h) / 2}
                          width={WAVE_W / SAMPLES - 1}
                          height={h}
                        />
                      )
                    })}
                  </svg>
                  <span className="am__db">{toDb(v)}</span>
                </div>
              )
            })}
          </Zone>
        </div>

        <div className={`am__right ${props.accessibility ? 'has-access' : ''}`}>
          {props.accessibility && <Accessibility spec={props.accessibility} />}
          <Zone id="mixer" className="am__panel am__mixer">
            <p className="am__panel-title">Mixage</p>
            <div className="am__buses">
              {props.buses.map((b) => {
                const level = Math.max(0, Math.min(1, (b.db + 48) / 54))
                return (
                  <div key={b.name} className="am__bus">
                    <span className="am__meter">
                      <span style={{ height: `${level * 100}%` }} />
                    </span>
                    <span className="am__bus-db">
                      {b.db > 0 ? '+' : ''}
                      {b.db.toLocaleString('fr-FR').replace('-', '−')}
                    </span>
                    <span className="am__bus-name">{b.name}</span>
                  </div>
                )
              })}
            </div>
          </Zone>
        </div>
      </div>
    </AppWindow>
  )
}

const ARROWS: Record<
  NonNullable<AudioMixerProps['accessibility']>['captions'][number]['direction'],
  string
> = {
  left: '◀',
  right: '▶',
  front: '▲',
  back: '▼',
  around: '◎',
}

/** Angle (degrés, 0 = devant, sens horaire) de chaque direction, pour la boussole. */
const ANGLES = { left: 270, right: 90, front: 0, back: 180 } as const

/** Aperçu des sous-titres des sons en jeu, boussole des directions, réglages du joueur. */
function Accessibility({ spec }: { spec: NonNullable<AudioMixerProps['accessibility']> }) {
  return (
    <>
      <Zone id="captions" className="am__panel am__captions">
        <p className="am__panel-title">Sous-titres des sons</p>
        <div className="am__scene">
          <span className="am__scene-label">{spec.scene}</span>
          <svg
            className="am__compass"
            width={46}
            height={46}
            viewBox="-23 -23 46 46"
            aria-hidden="true"
          >
            <circle r={18} className="am__compass-ring" />
            <circle r={3} className="am__compass-me" />
            {spec.captions.map((c, i) =>
              c.direction === 'around' ? (
                <circle key={i} r={13} className="am__compass-around" />
              ) : (
                <circle
                  key={i}
                  r={4}
                  className="am__compass-dot"
                  cx={18 * Math.sin((ANGLES[c.direction] * Math.PI) / 180)}
                  cy={-18 * Math.cos((ANGLES[c.direction] * Math.PI) / 180)}
                />
              ),
            )}
          </svg>
          <div className="am__subs">
            {spec.captions.map((c) => (
              <p key={c.text} className={`am__sub am__sub--${c.direction}`}>
                {c.direction === 'left' || c.direction === 'around' ? (
                  <span aria-hidden="true">{ARROWS[c.direction]} </span>
                ) : null}
                {c.text}
                {c.direction !== 'left' && c.direction !== 'around' ? (
                  <span aria-hidden="true"> {ARROWS[c.direction]}</span>
                ) : null}
              </p>
            ))}
          </div>
        </div>
      </Zone>
      <Zone id="audio-options" className="am__panel am__options">
        <p className="am__panel-title">Options du joueur</p>
        <ul>
          {spec.options.map((o) => (
            <li key={o.label}>
              <span>{o.label}</span>
              <span
                className={`am__opt ${o.on === true ? 'is-on' : o.on === false ? 'is-off' : ''}`}
              >
                {o.value}
              </span>
            </li>
          ))}
        </ul>
      </Zone>
    </>
  )
}
