import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

/**
 * Rangée de cartes sur une seule ligne, qui défile à gauche et à droite : flèches,
 * molette, glisser au doigt ou Tab d'une carte à l'autre (la carte focalisée devient
 * visible). Les points indiquent la position et permettent d'y sauter.
 */
export function Carousel({ label, children }: { label: string; children: ReactNode }) {
  const track = useRef<HTMLUListElement>(null)
  const items = Children.toArray(children)
  const [state, setState] = useState({ start: true, end: true, index: 0 })

  const measure = useCallback(() => {
    const el = track.current
    if (!el) return
    const cards = [...el.children] as HTMLElement[]
    const center = el.scrollLeft + el.clientWidth / 2
    let index = 0
    cards.forEach((c, i) => {
      const best = cards[index]!
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center)
      if (d < Math.abs(best.offsetLeft + best.offsetWidth / 2 - center)) index = i
    })
    setState({
      start: el.scrollLeft <= 2,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
      index,
    })
  }, [])

  useEffect(() => {
    const el = track.current
    if (!el) return
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    // La molette verticale fait défiler la rangée.
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      const max = el.scrollWidth - el.clientWidth
      if ((e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft >= max)) return
      e.preventDefault()
      el.scrollBy({ left: e.deltaY })
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      observer.disconnect()
      el.removeEventListener('wheel', wheel)
    }
  }, [measure, items.length])

  const goTo = (index: number) => {
    const card = track.current?.children[index] as HTMLElement | undefined
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }
  const page = (dir: 1 | -1) => {
    const el = track.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }
  const scrollable = !(state.start && state.end)

  return (
    <div className="carousel" role="group" aria-roledescription="carrousel" aria-label={label}>
      <div className="carousel__row">
        <button
          type="button"
          className="carousel__arrow"
          onClick={() => page(-1)}
          disabled={state.start}
          hidden={!scrollable}
          aria-label="Précédent"
        >
          ‹
        </button>
        <ul
          ref={track}
          className={`carousel__track ${state.start ? '' : 'has-before'} ${state.end ? '' : 'has-after'}`}
          onScroll={measure}
          onFocus={(e) => {
            const li = (e.target as HTMLElement).closest('li')
            li?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
          }}
        >
          {items.map((item, i) => (
            <li key={isValidElement(item) && item.key !== null ? item.key : i}>{item}</li>
          ))}
        </ul>
        <button
          type="button"
          className="carousel__arrow"
          onClick={() => page(1)}
          disabled={state.end}
          hidden={!scrollable}
          aria-label="Suivant"
        >
          ›
        </button>
      </div>
      {scrollable && (
        <div className="carousel__dots">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              tabIndex={-1}
              className={i === state.index ? 'is-current' : ''}
              onClick={() => goTo(i)}
              aria-label={`Carte ${i + 1} sur ${items.length}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
