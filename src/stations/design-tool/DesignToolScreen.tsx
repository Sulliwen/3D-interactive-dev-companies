import { useEffect, useMemo, useState } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { StatusBadge } from '../common/charts'
import { PocketSantePhone } from '../common/PocketSantePhone'
import type { ScreenComponentProps } from '../types'
import { designToolPropsSchema } from './schema'
import './design-tool.css'

/** Géométrie du canevas (px CSS) : 4 maquettes côte à côte, reliées par des flèches. */
const PHONE_W = 98
const GAP = 44
const ROW_LEFT = 22
const ARROW_Y = 96
const phoneX = (i: number) => ROW_LEFT + i * (PHONE_W + GAP)

/** Outil de maquettage fictif « Atelier Design », inspiré des outils du marché. */
export function DesignToolScreen({ toolName, props: rawProps }: ScreenComponentProps) {
  const props = useMemo(() => designToolPropsSchema.parse(rawProps), [rawProps])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  const [mode, setMode] = useState<'design' | 'prototype'>('design')
  const tab = live ? 0 : -1

  // Une bulle vise une zone du mode « Design » : y revenir (pendant le rendu).
  const [handledZone, setHandledZone] = useState<string | null>(null)
  if (revealZone !== handledZone) {
    setHandledZone(revealZone)
    if (revealZone && ['frames', 'flow', 'comment'].includes(revealZone) && mode !== 'design') {
      setMode('design')
    }
  }
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, mode, zoneRevealed])

  return (
    <AppWindow
      toolName={toolName}
      title={props.file}
      titleRight={
        <span className="dt__people" aria-label="Personnes connectées">
          {props.collaborators.map((c) => (
            <i key={c}>{c}</i>
          ))}
        </span>
      }
    >
      <div className="dt__tools" aria-hidden="true">
        <span className="dt__tool dt__tool--active">
          <svg viewBox="0 0 16 16" width="16" height="16">
            <path d="M3 2l9 5-4 1-2 4z" fill="currentColor" />
          </svg>
        </span>
        <span className="dt__tool">
          <svg viewBox="0 0 16 16" width="16" height="16">
            <path d="M5 2v12M11 2v12M2 5h12M2 11h12" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
        <span className="dt__tool">
          <svg viewBox="0 0 16 16" width="16" height="16">
            <path d="M3 3h10M8 3v10" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
        <span className="dt__tool">
          <svg viewBox="0 0 16 16" width="16" height="16">
            <path d="M2 3h12v8H7l-3 3v-3H2z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </div>

      <div className="dt__layers">
        <p className="dt__heading">Pages</p>
        {props.pages.map((p, i) => (
          <p key={p} className={`dt__layer ${i === 0 ? 'dt__layer--active' : ''}`}>
            {p}
          </p>
        ))}
        <p className="dt__heading">Calques</p>
        {props.frames.map((f, i) => (
          <p key={f.caption} className="dt__layer dt__layer--frame">
            <span aria-hidden="true">#</span> {i + 1}. {f.caption}
          </p>
        ))}
      </div>

      <div className="dt__main">
        <div className="dt__toolbar">
          <Zone id="prototype" className="dt__modes">
            <div role="tablist" aria-label="Mode">
              {(['design', 'prototype'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  tabIndex={tab}
                  className={`dt__mode ${mode === m ? 'dt__mode--active' : ''}`}
                  onClick={() => setMode(m)}
                >
                  {m === 'design' ? 'Design' : '▶ Prototype'}
                </button>
              ))}
            </div>
          </Zone>
          <span className="dt__zoom">67 %</span>
        </div>

        {mode === 'design' ? (
          <div className="dt__canvas">
            <div
              className="dt__branch-box"
              style={{ left: phoneX(1) + PHONE_W / 2, width: phoneX(3) - phoneX(1) }}
            >
              <Zone id="flow" className="dt__branch">
                <svg width={phoneX(3) - phoneX(1)} height={44} aria-hidden="true">
                  <path
                    d={`M2,42 C2,6 ${phoneX(3) - phoneX(1) - 2},6 ${phoneX(3) - phoneX(1) - 2},38`}
                    className="dt__arrow dt__arrow--alt"
                  />
                  <path
                    d={`M${phoneX(3) - phoneX(1) - 7},33 l5,7 l5,-7`}
                    className="dt__arrow dt__arrow--alt"
                  />
                </svg>
                <span className="dt__branch-label">{props.flow.toTooLate}</span>
              </Zone>
            </div>

            <Zone id="frames" className="dt__frames">
              {props.frames.map((f, i) => (
                <div key={f.caption} className="dt__frame" style={{ left: phoneX(i) - ROW_LEFT }}>
                  <PocketSantePhone
                    state={f.state}
                    when={f.when}
                    width={PHONE_W}
                    caption={`${i + 1}. ${f.caption}`}
                  />
                </div>
              ))}
              {[props.flow.toConfirm, props.flow.toDone].map((label, i) => (
                <div
                  key={label}
                  className="dt__link"
                  style={{ left: phoneX(i) - ROW_LEFT + PHONE_W + 3, top: ARROW_Y }}
                >
                  <span>{label}</span>
                  <svg width={GAP - 6} height={10} aria-hidden="true">
                    <path d={`M0,5 H${GAP - 9} M${GAP - 13},1 l5,4 l-5,4`} className="dt__arrow" />
                  </svg>
                </div>
              ))}
            </Zone>

            <Zone id="comment" className="dt__comment">
              <i>{props.comment.initials}</i>
              <p>
                <strong>{props.comment.author}</strong> {props.comment.text}
              </p>
            </Zone>
          </div>
        ) : (
          <div className="dt__canvas dt__canvas--proto">
            <div className="dt__proto-text">
              <p className="dt__proto-title">{props.prototype.title}</p>
              <p>{props.prototype.hint}</p>
            </div>
            <PocketSantePhone
              state={props.frames[0]!.state}
              when={props.frames[0]!.when}
              interactive={live}
              width={168}
            />
          </div>
        )}
      </div>

      <div className="dt__inspector">
        <Zone id="components" className="dt__block">
          <p className="dt__heading">Composants</p>
          {props.components.map((c) => (
            <div key={c.name} className="dt__component">
              <span className={`dt__sample dt__sample--${c.kind}`}>{c.label}</span>
              <span className="dt__component-name">{c.name}</span>
            </div>
          ))}
        </Zone>

        <div className="dt__block">
          <p className="dt__heading">Couleurs</p>
          <div className="dt__swatches">
            {props.colors.map((c) => (
              <span key={c.name} className="dt__swatch">
                <i style={{ background: c.hex }} />
                {c.name}
              </span>
            ))}
          </div>
        </div>

        <div className="dt__block">
          <p className="dt__heading">Typographie</p>
          {props.typography.map((t) => (
            <p key={t.name} className="dt__type">
              <span>{t.name}</span> {t.spec}
            </p>
          ))}
        </div>

        <Zone id="accessibility" className="dt__block">
          <p className="dt__heading">Accessibilité</p>
          {props.accessibility.map((a) => (
            <div key={a.label} className="dt__check">
              <span>{a.label}</span>
              <StatusBadge status={a.ok ? 'good' : 'warning'}>{a.value}</StatusBadge>
            </div>
          ))}
        </Zone>
      </div>
    </AppWindow>
  )
}
