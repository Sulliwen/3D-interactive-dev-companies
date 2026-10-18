import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Vec3 } from '../engine/world/floorplan'
import { stations } from '../content/loader'
import { emptyProgress, markVisited, sanitizeProgress, type Progress } from './progress'
import { safeStorage } from './safeStorage'

export type Quality = 'low' | 'high'

/** Panneau ouvert par-dessus la visite. */
export type Overlay = 'none' | 'catalog' | 'glossary' | 'finale'

export interface Settings {
  clickToMove: boolean
  reducedMotion: boolean
  quality: Quality
  /** Taille du texte de l'interface (1 = normale). */
  textScale: number
  /** Ligne lumineuse au sol vers le prochain poste du fil rouge. */
  guidedPath: boolean
  minimap: MinimapSize
  /** Avatar choisi à l'accueil (public/models/characters/<id>.glb). */
  avatar: AvatarId
  /** L'écran d'accueil a-t-il déjà été passé ? */
  welcomed: boolean
  /** Volume de l'ambiance sonore (0 à 1). */
  volume: number
  muted: boolean
  /** Le tutoriel (4 étapes) a-t-il été suivi ou passé ? */
  tutorialDone: boolean
  /** L'écran de fin a-t-il déjà été montré (il s'ouvre une fois, tout seul) ? */
  finaleShown: boolean
}

export type AvatarId = 'visitor_a' | 'visitor_b' | 'visitor_c'

export type MinimapSize = 'small' | 'large' | 'hidden'

interface GameState {
  settings: Settings
  progress: Progress
  /** Numéro du poste à portée du visiteur (≈ 2 m), ou `null`. */
  nearbyStation: number | null
  /** Destination choisie d'un clic au sol. */
  moveTarget: Vec3 | null
  /** Poste dont on regarde l'écran (zoom), ou `null` en balade. */
  activeStation: number | null
  /** Largeur (px) de la fiche affichée à droite pendant le zoom, pour cadrer l'écran. */
  sheetWidth: number
  overlay: Overlay
  /** Poste affiché dans « Tous les postes » (`null` : la liste). */
  catalogStation: number | null
  /** Terme à mettre en avant à l'ouverture du glossaire. */
  glossaryFocus: string | null
  /** Demande d'ouverture d'une bulle d'explication depuis la fiche (`nonce` : la rejouer). */
  annotationRequest: { id: string; nonce: number } | null
  debugPhysics: boolean
  /** Dev : afficher l'étage en boîtes même si le modèle Blender est disponible. */
  forceBlockout: boolean
  showPerf: boolean
  toast: string | null

  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  visitStation: (stationId: string) => void
  resetProgress: () => void
  setNearbyStation: (n: number | null) => void
  setMoveTarget: (t: Vec3 | null) => void
  openStation: (n: number) => void
  closeStation: () => void
  setSheetWidth: (px: number) => void
  openCatalog: (station?: number | null) => void
  openGlossary: (termId?: string | null) => void
  openFinale: () => void
  closeOverlay: () => void
  requestAnnotation: (id: string) => void
  toggleDebugPhysics: () => void
  toggleBlockout: () => void
  togglePerf: () => void
  showToast: (message: string | null) => void
}

const prefersReducedMotion = (): boolean => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      settings: {
        clickToMove: true,
        reducedMotion: prefersReducedMotion(),
        quality: 'high',
        textScale: 1,
        guidedPath: true,
        minimap: 'small',
        avatar: 'visitor_a',
        welcomed: false,
        volume: 0.7,
        muted: false,
        tutorialDone: false,
        finaleShown: false,
      },
      progress: emptyProgress,
      nearbyStation: null,
      moveTarget: null,
      activeStation: null,
      sheetWidth: 0,
      overlay: 'none',
      catalogStation: null,
      glossaryFocus: null,
      annotationRequest: null,
      debugPhysics: false,
      forceBlockout: false,
      showPerf: false,
      toast: null,

      setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),
      visitStation: (id) => set((s) => ({ progress: markVisited(s.progress, id) })),
      resetProgress: () => set({ progress: emptyProgress }),
      setNearbyStation: (n) => set({ nearbyStation: n }),
      setMoveTarget: (t) => set({ moveTarget: t }),
      openStation: (n) =>
        set((s) => {
          const station = stations.find((st) => st.number === n)
          return {
            activeStation: n,
            moveTarget: null,
            progress: station ? markVisited(s.progress, station.id) : s.progress,
          }
        }),
      closeStation: () => set({ activeStation: null, annotationRequest: null }),
      setSheetWidth: (px) => set({ sheetWidth: px }),
      // Le catalogue remplace la vue 3D : on quitte l'écran éventuellement zoomé.
      openCatalog: (station = null) =>
        set({ overlay: 'catalog', catalogStation: station, activeStation: null }),
      openGlossary: (termId = null) => set({ overlay: 'glossary', glossaryFocus: termId }),
      openFinale: () =>
        set((s) => ({
          overlay: 'finale',
          activeStation: null,
          settings: { ...s.settings, finaleShown: true },
        })),
      closeOverlay: () => set({ overlay: 'none', glossaryFocus: null }),
      requestAnnotation: (id) =>
        set((s) => ({ annotationRequest: { id, nonce: (s.annotationRequest?.nonce ?? 0) + 1 } })),
      toggleDebugPhysics: () => set((s) => ({ debugPhysics: !s.debugPhysics })),
      toggleBlockout: () => set((s) => ({ forceBlockout: !s.forceBlockout })),
      togglePerf: () => set((s) => ({ showPerf: !s.showPerf })),
      showToast: (message) => set({ toast: message }),
    }),
    {
      name: 'atelier-lumen-visite',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      // Seuls les réglages et la progression sont mémorisés.
      partialize: (s) => ({ settings: s.settings, progress: s.progress }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Pick<GameState, 'settings' | 'progress'>>
        return {
          ...current,
          settings: { ...current.settings, ...p.settings },
          progress: sanitizeProgress(
            p.progress,
            stations.map((s) => s.id),
          ),
        }
      },
    },
  ),
)

// Accès depuis la console du navigateur (et les tests de bout en bout), en dev uniquement.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { __atelier: typeof useGameStore }).__atelier = useGameStore
}

/** Le visiteur peut-il se déplacer (ni zoom, ni panneau ouvert) ? */
export const isExploring = (
  s: Pick<GameState, 'activeStation' | 'overlay' | 'settings'>,
): boolean => s.activeStation === null && s.overlay === 'none' && s.settings.welcomed
