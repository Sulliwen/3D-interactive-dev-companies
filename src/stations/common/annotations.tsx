import type { ReactNode } from 'react'
import { useAnnotations } from './annotationContext'

/**
 * Zone d'un écran simulé : un repère où une pastille numérotée peut se poser.
 * La zone est surlignée quand sa bulle est ouverte.
 */
export function Zone({
  id,
  className,
  children,
}: {
  id: string
  className?: string
  children: ReactNode
}) {
  const { live, annotations, openId, open } = useAnnotations()
  const annotation = annotations.find((a) => a.zone === id)
  const active = annotation !== undefined && annotation.id === openId

  return (
    <div data-zone={id} className={`zone ${active ? 'zone--active' : ''} ${className ?? ''}`}>
      {children}
      {live && annotation && (
        <button
          type="button"
          className={`pastille ${active ? 'pastille--active' : ''}`}
          aria-label={`Explication ${annotation.n} : ${annotation.title}`}
          aria-expanded={active}
          onClick={() => open(annotation.id)}
        >
          {annotation.n}
        </button>
      )}
    </div>
  )
}
