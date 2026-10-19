import { useEffect, useMemo } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import type { ScreenComponentProps } from '../types'
import { Painting } from './Painting'
import { artBoardPropsSchema } from './schema'
import './art-board.css'

/** « Planche » : peinture numérique fictive. Dessin principal, pistes, script couleur, notes. */
export function ArtBoardScreen({ toolName, props: raw }: ScreenComponentProps) {
  const props = useMemo(() => artBoardPropsSchema.parse(raw), [raw])
  const { revealZone, zoneRevealed } = useAnnotations()
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  return (
    <AppWindow toolName={toolName} title={props.file} titleRight={<span>{props.brush}</span>}>
      <div className="ab__tools" aria-hidden="true">
        {[
          'M3 13l7-7 3 3-7 7H3z',
          'M8 2a6 6 0 100 12 6 6 0 000-12z',
          'M2 14L14 2M5 2h9v9',
          'M3 3h10v10H3z',
        ].map((d, i) => (
          <span key={d} className={`ab__tool ${i === 0 ? 'ab__tool--active' : ''}`}>
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
        ))}
        <span className="ab__swatch" style={{ background: props.colorScript.at(-1)?.light }} />
      </div>

      <div className="ab__main">
        <Zone id="canvas" className="ab__canvas">
          <Painting
            kind={props.canvas.kind}
            mood={props.canvas.mood}
            variant={props.canvas.variant}
            logo={props.canvas.logo}
            width={560}
            height={300}
          />
          <span className="ab__canvas-title">{props.canvas.title}</span>
        </Zone>

        <Zone id="color-script" className="ab__script">
          <p className="ab__heading">{props.scriptTitle}</p>
          <ol className="ab__beats">
            {props.colorScript.map((b) => (
              <li key={b.label}>
                <span
                  className="ab__beat"
                  style={{ background: `linear-gradient(${b.sky} 0 55%, ${b.light} 55% 100%)` }}
                />
                <span className="ab__beat-label">{b.label}</span>
              </li>
            ))}
          </ol>
        </Zone>
      </div>

      <div className="ab__side">
        <Zone id="variants" className="ab__panel">
          <p className="ab__heading">{props.variantsTitle}</p>
          <ul className="ab__variants">
            {props.variants.map((v) => (
              <li key={v.label} className={v.chosen ? 'is-chosen' : ''}>
                <span className="ab__thumb">
                  <Painting
                    kind={v.kind}
                    mood={v.mood}
                    variant={v.variant}
                    logo={v.logo}
                    {...thumbSize(v.format)}
                  />
                </span>
                <span>
                  <b>
                    {v.label}
                    {v.chosen && <em> · retenue</em>}
                  </b>
                  {v.format && (
                    <i className="ab__format">
                      {v.format.w} × {v.format.h} px
                    </i>
                  )}
                  {v.note}
                </span>
              </li>
            ))}
          </ul>
        </Zone>

        <Zone id="notes" className="ab__panel">
          <p className="ab__heading">Notes sur la planche</p>
          {props.notes.map((n) => (
            <p key={n.to} className="ab__note">
              <b>{n.to}</b> {n.text}
            </p>
          ))}
        </Zone>

        <Zone id="layers" className="ab__panel ab__layers">
          <p className="ab__heading">Calques</p>
          <ul>
            {props.layers.map((l, i) => (
              <li key={l} className={i === 0 ? 'is-active' : ''}>
                <i aria-hidden="true" />
                {l}
              </li>
            ))}
          </ul>
        </Zone>
      </div>
    </AppWindow>
  )
}

/** Miniature de 88 × 50 px, ou aux proportions du format imposé (dans la même case). */
function thumbSize(format?: { w: number; h: number }): { width: number; height: number } {
  if (!format) return { width: 88, height: 50 }
  const scale = Math.min(88 / format.w, 50 / format.h)
  return { width: Math.round(format.w * scale), height: Math.round(format.h * scale) }
}
