import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Station } from '../content/schema'
import { RichText } from '../ui/RichText'
import { useEscape } from '../ui/escapeStack'
import { useGameStore } from '../state/useGameStore'
import { AnnotationContext, type AnnotationContextValue } from './common/annotationContext'
import { screens } from './registry'
import './screen.css'

/** Taille de l'écran simulé, en pixels CSS (proportions du moniteur 3D : 62 × 36 cm). */
export const SCREEN_WIDTH = 960
export const SCREEN_HEIGHT = 557

/**
 * Cadre d'un écran simulé : choisit le composant de l'outil, numérote les
 * pastilles et affiche la bulle d'explication ouverte.
 */
export function ScreenFrame({ station, live }: { station: Station; live: boolean }) {
  const screen = station.screen
  const annotations = useMemo(
    () => (screen?.annotations ?? []).map((a, i) => ({ ...a, n: i + 1 })),
    [screen],
  )
  const [openId, setOpenId] = useState<string | null>(null)
  const [revealZone, setRevealZone] = useState<string | null>(null)
  const [measure, setMeasure] = useState(0)
  const root = useRef<HTMLDivElement>(null)

  const open = useCallback(
    (id: string) => {
      setOpenId(id)
      setRevealZone(annotations.find((a) => a.id === id)?.zone ?? null)
      setMeasure((m) => m + 1)
    },
    [annotations],
  )
  const zoneRevealed = useCallback(() => {
    setRevealZone(null)
    setMeasure((m) => m + 1)
  }, [])
  useEscape(() => setOpenId(null), live && openId !== null)

  // La fiche du poste peut demander l'ouverture d'une bulle (« Sur l'écran »).
  useEffect(() => {
    if (!live) return
    return useGameStore.subscribe((state, prev) => {
      const request = state.annotationRequest
      if (
        request &&
        request !== prev.annotationRequest &&
        annotations.some((a) => a.id === request.id)
      ) {
        open(request.id)
      }
    })
  }, [live, annotations, open])

  const context: AnnotationContextValue = useMemo(
    () => ({ live, annotations, openId, open, revealZone, zoneRevealed }),
    [live, annotations, openId, open, revealZone, zoneRevealed],
  )

  const Component = screen ? screens[screen.component]?.component : undefined
  const current = annotations.find((a) => a.id === openId)

  return (
    <div
      ref={root}
      className="screen"
      style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
      data-live={live}
    >
      <AnnotationContext.Provider value={context}>
        {Component && screen ? (
          <Component toolName={screen.toolName} props={screen.props} />
        ) : (
          <PlaceholderScreen station={station} />
        )}
        {live && current && (
          <Bubble
            key={current.id}
            root={root}
            measure={measure}
            annotation={current}
            total={annotations.length}
            onClose={() => setOpenId(null)}
            onPrev={current.n > 1 ? () => open(annotations[current.n - 2]!.id) : undefined}
            onNext={
              current.n < annotations.length ? () => open(annotations[current.n]!.id) : undefined
            }
          />
        )}
      </AnnotationContext.Provider>
    </div>
  )
}

const BUBBLE_WIDTH = 330
const PASTILLE_COLUMN = 44

function Bubble({
  root,
  measure,
  annotation,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  root: React.RefObject<HTMLDivElement | null>
  measure: number
  annotation: { id: string; n: number; zone: string; title: string; text: string }
  total: number
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}) {
  const bubble = useRef<HTMLDivElement>(null)

  // Placement sous la zone (ou au-dessus), dans le repère de l'écran. L'écran peut
  // être agrandi ou mis en perspective : on ramène les mesures à ses pixels CSS.
  // La position est écrite directement dans le style : la suivre au défilement
  // ne provoque aucun nouveau rendu React.
  useLayoutEffect(() => {
    const r = root.current
    const b = bubble.current
    if (!r || !b) return
    const place = () => {
      const zone = r.querySelector<HTMLElement>(`[data-zone="${annotation.zone}"]`)
      if (!zone) return
      const rr = r.getBoundingClientRect()
      const scale = rr.width / r.offsetWidth || 1
      const z = zone.getBoundingClientRect()
      const zTop = (z.top - rr.top) / scale
      const zBottom = (z.bottom - rr.top) / scale
      const zLeft = (z.left - rr.left) / scale
      const zRight = (z.right - rr.left) / scale
      const h = b.offsetHeight
      const margin = 10
      const clampTop = (t: number) => Math.max(margin, Math.min(SCREEN_HEIGHT - h - margin, t))
      // Par ordre de préférence : sous la zone, au-dessus, à côté (sans la masquer),
      // et en dernier recours par-dessus, en laissant libre la colonne des pastilles.
      let top: number
      let left = Math.min(
        Math.max(margin, zRight - BUBBLE_WIDTH - PASTILLE_COLUMN),
        SCREEN_WIDTH - BUBBLE_WIDTH - margin,
      )
      if (zBottom + margin + h <= SCREEN_HEIGHT - margin) top = zBottom + margin
      else if (zTop - margin - h >= margin) top = zTop - h - margin
      else if (zLeft - BUBBLE_WIDTH - margin >= margin) {
        left = zLeft - BUBBLE_WIDTH - margin
        top = clampTop(zTop)
      } else if (zRight + PASTILLE_COLUMN + BUBBLE_WIDTH + margin <= SCREEN_WIDTH) {
        left = zRight + PASTILLE_COLUMN
        top = clampTop(zTop)
      } else top = clampTop(zTop + 24)
      b.style.left = `${left}px`
      b.style.top = `${top}px`
      b.style.visibility = 'visible'
    }
    place()
    r.addEventListener('scroll', place, true)
    return () => r.removeEventListener('scroll', place, true)
  }, [root, annotation.zone, measure])

  useLayoutEffect(() => {
    bubble.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div
      ref={bubble}
      className="bubble"
      role="dialog"
      aria-label={`Explication ${annotation.n} sur ${total} : ${annotation.title}`}
      tabIndex={-1}
      style={{ width: BUBBLE_WIDTH, left: 0, top: 0, visibility: 'hidden' }}
    >
      <div className="bubble__head">
        <span className="bubble__count">
          {annotation.n} / {total}
        </span>
        <button
          type="button"
          className="bubble__close"
          aria-label="Fermer l'explication"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <p className="bubble__title">{annotation.title}</p>
      <p className="bubble__text">
        <RichText text={annotation.text} />
      </p>
      <div className="bubble__nav">
        <button type="button" onClick={onPrev} disabled={!onPrev}>
          ← Précédent
        </button>
        <button type="button" onClick={onNext ?? onClose} className="bubble__next">
          {onNext ? 'Suivant →' : 'Terminer'}
        </button>
      </div>
    </div>
  )
}

function PlaceholderScreen({ station }: { station: Station }) {
  return (
    <div className="placeholder">
      <p className="placeholder__number">
        {station.step === null ? 'Hors du parcours' : `Étape ${station.step}`}
      </p>
      <p className="placeholder__title">{station.title}</p>
      {station.absent ? (
        <p className="placeholder__soon">
          Écran éteint : {station.person.firstName} n'est pas encore là.
        </p>
      ) : station.status === 'bystander' ? (
        <p className="placeholder__soon">Ce poste n'intervient pas dans ce scénario.</p>
      ) : (
        <>
          <p>{station.featureStep}</p>
          <p className="placeholder__soon">L'écran de ce poste est en préparation.</p>
        </>
      )}
    </div>
  )
}
