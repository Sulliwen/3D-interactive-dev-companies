import type { ReactNode } from 'react'
import './common.css'

/**
 * Cadre commun des outils simulés : barre de titre aux couleurs d'Atelier Lumen,
 * contenu, barre d'état facultative. Remplit tout l'écran (960 × 557 px).
 */
export function AppWindow({
  toolName,
  title,
  titleRight,
  status,
  children,
}: {
  /** Nom de l'outil fictif (fourni par la fiche). */
  toolName: string
  /** Document ou vue en cours (ex. « Ticket #4521 »). */
  title?: string
  titleRight?: ReactNode
  /** Contenu de la barre d'état (en bas, orange). */
  status?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="aw">
      <div className="aw__titlebar">
        <span className="aw__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="aw__title">{title ? `${title} — ${toolName}` : toolName}</span>
        {titleRight && <span className="aw__title-right">{titleRight}</span>}
      </div>
      <div className="aw__body">{children}</div>
      {status && <div className="aw__status">{status}</div>}
    </div>
  )
}
