import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { getGlossaryEntry } from '../content/loader'
import { inlineLabel } from '../content/richText'
import { useGameStore } from '../state/useGameStore'
import { useEscape } from './escapeStack'

/**
 * Terme du glossaire dans un texte : souligné, il affiche sa définition au survol,
 * au focus clavier ou au clic (le clic l'épingle, avec un lien vers le glossaire).
 */
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const entry = getGlossaryEntry(id)
  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const anchor = useRef<HTMLButtonElement>(null)
  const tooltipId = useId()
  const openGlossary = useGameStore((s) => s.openGlossary)
  const open = hover || pinned
  useEscape(() => setPinned(false), pinned)

  if (!entry) return <>{children ?? id}</>

  return (
    <>
      <button
        ref={anchor}
        type="button"
        className="term"
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={pinned}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        onClick={() => setPinned((p) => !p)}
      >
        {children ?? inlineLabel(entry.term)}
      </button>
      {open &&
        createPortal(
          <TermPopover anchor={anchor} id={tooltipId}>
            <p className="term-pop__title">{entry.term}</p>
            <p>{entry.definition}</p>
            {entry.analogy && (
              <p className="term-pop__analogy">
                <span>Pour faire simple :</span> {entry.analogy}
              </p>
            )}
            {pinned && (
              <button
                type="button"
                className="term-pop__more"
                onClick={() => {
                  setPinned(false)
                  openGlossary(id)
                }}
              >
                Voir dans le glossaire →
              </button>
            )}
          </TermPopover>,
          document.body,
        )}
    </>
  )
}

/** Bulle placée au-dessus du terme (ou en dessous s'il manque de place), dans la fenêtre. */
function TermPopover({
  anchor,
  id,
  children,
}: {
  anchor: React.RefObject<HTMLElement | null>
  id: string
  children: ReactNode
}) {
  const pop = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    const a = anchor.current?.getBoundingClientRect()
    const p = pop.current?.getBoundingClientRect()
    if (!a || !p) return
    const margin = 8
    const left = Math.min(
      Math.max(margin, a.left + a.width / 2 - p.width / 2),
      window.innerWidth - p.width - margin,
    )
    const above = a.top - p.height - margin
    const top =
      above >= margin ? above : Math.min(a.bottom + margin, window.innerHeight - p.height - margin)
    setPos({ left, top })
  }, [anchor])

  return (
    <div
      ref={pop}
      id={id}
      role="tooltip"
      className="term-pop"
      style={pos ? { left: pos.left, top: pos.top } : { left: -9999, top: 0 }}
    >
      {children}
    </div>
  )
}
