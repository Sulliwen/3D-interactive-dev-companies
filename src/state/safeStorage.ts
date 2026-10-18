import type { StateStorage } from 'zustand/middleware'

/**
 * Accès à localStorage qui ne plante jamais : navigation privée, stockage plein
 * ou bloqué par l'intranet… La visite fonctionne alors simplement sans mémoire.
 */
export const safeStorage: StateStorage = {
  getItem(name) {
    try {
      return window.localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem(name, value) {
    try {
      window.localStorage.setItem(name, value)
    } catch {
      // Ignoré volontairement : la progression ne sera pas conservée.
    }
  },
  removeItem(name) {
    try {
      window.localStorage.removeItem(name)
    } catch {
      // Idem.
    }
  },
}
