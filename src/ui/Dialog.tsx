import { useEffect, useRef, type ReactNode } from 'react'
import { useEscape } from './escapeStack'

/**
 * Fenêtre modale accessible : focus placé dedans à l'ouverture et rendu à
 * l'élément d'origine à la fermeture, Tab qui reste à l'intérieur, Échap pour fermer.
 * Sans `onClose`, elle ne se ferme pas (menu de lancement sans visite choisie).
 * `footer` reste visible en bas, hors de la zone qui défile : les boutons de validation
 * restent accessibles même sur un écran peu haut.
 */
export function Dialog({
  title,
  onClose,
  className,
  footer,
  children,
}: {
  title: string
  onClose?: () => void
  className?: string
  footer?: ReactNode
  children: ReactNode
}) {
  const box = useRef<HTMLDivElement>(null)
  useEscape(() => onClose?.(), onClose !== undefined)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const el = box.current
    ;(
      el?.querySelector<HTMLElement>('[data-autofocus]') ??
      el?.querySelector<HTMLElement>('button, input')
    )?.focus()
    return () => previous?.focus?.()
  }, [])

  const trapTab = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !box.current) return
    const focusables = [
      ...box.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input, [href], [tabindex]:not([tabindex="-1"])',
      ),
    ]
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (!first || !last) return
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        ref={box}
        className={`dialog ${className ?? ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={trapTab}
      >
        <div className="dialog__head">
          <h2>{title}</h2>
          {onClose && (
            <button type="button" className="button button--ghost" onClick={onClose}>
              Fermer
            </button>
          )}
        </div>
        <div className="dialog__body">{children}</div>
        {footer && <div className="dialog__foot">{footer}</div>}
      </div>
    </div>
  )
}
