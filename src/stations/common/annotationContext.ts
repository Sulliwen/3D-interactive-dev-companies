import { createContext, useContext } from 'react'
import type { Annotation } from '../../content/schema'

export interface NumberedAnnotation extends Annotation {
  n: number
}

export interface AnnotationContextValue {
  /** `live` : écran interactif ; `static` : rendu figé pour la texture vue de loin. */
  live: boolean
  annotations: NumberedAnnotation[]
  openId: string | null
  open: (id: string) => void
  /** Zone que l'écran doit rendre visible (changer d'onglet, faire défiler…). */
  revealZone: string | null
  /** L'écran signale qu'il a fini de rendre visible une zone (re-mesure de la bulle). */
  zoneRevealed: () => void
}

export const AnnotationContext = createContext<AnnotationContextValue>({
  live: false,
  annotations: [],
  openId: null,
  open: () => {},
  revealZone: null,
  zoneRevealed: () => {},
})

export const useAnnotations = () => useContext(AnnotationContext)
