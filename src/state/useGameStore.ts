import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Vec3 } from '../engine/world/floorplan'
import {
  findStructure,
  getVisit,
  isKnownVisit,
  stationAtDesk,
  visitKey,
  type VisitRef,
} from '../content/loader'
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
  /** Volume de l'ambiance sonore (0 à 1). */
  volume: number
  muted: boolean
  /** Le tutoriel (4 étapes) a-t-il été suivi ou passé ? */
  tutorialDone: boolean
}

export type AvatarId = 'visitor_a' | 'visitor_b' | 'visitor_c'

export type MinimapSize = 'small' | 'large' | 'hidden'

/** Écran du menu de lancement : accueil (reprendre ou changer), ou choix de la visite. */
export type MenuStep = 'home' | 'pick'

interface GameState {
  settings: Settings
  /** Structure et scénario choisis (`null` : pas encore choisis, à l'accueil). */
  visit: VisitRef | null
  /** Progression de chaque visite, par clé `structure/scénario`. */
  progress: Record<string, Progress>
  /** Visites dont l'écran de fin a déjà été montré (il s'ouvre une fois, tout seul). */
  finalesShown: string[]
  /** Menu de lancement, affiché à chaque ouverture (`null` : fermé, on visite). */
  menu: MenuStep | null
  /**
   * Présentation du scénario en cours : -1 pour l'ouverture (vue d'ensemble), puis
   * l'indice de l'étape survolée dans le parcours ; `null` hors présentation.
   */
  tour: number | null
  /** Monde (étage) entièrement chargé et affiché, ou `null` pendant un chargement. */
  worldReady: string | null
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
  /** Change de visite : la scène et le parcours se mettent à jour. */
  chooseVisit: (ref: VisitRef) => void
  openMenu: (step?: MenuStep) => void
  closeMenu: () => void
  /** Ferme le menu sur la visite choisie et lance sa présentation. */
  launchVisit: (ref: VisitRef) => void
  setTour: (index: number | null) => void
  setWorldReady: (world: string | null) => void
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
        volume: 0.7,
        muted: false,
        tutorialDone: false,
      },
      visit: null,
      progress: {},
      finalesShown: [],
      menu: 'home',
      tour: null,
      worldReady: null,
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
      chooseVisit: (ref) =>
        set(() => ({
          visit: ref,
          tour: null,
          activeStation: null,
          nearbyStation: null,
          moveTarget: null,
          overlay: 'none',
          catalogStation: null,
        })),
      openMenu: (step = 'home') =>
        set({ menu: step, tour: null, activeStation: null, overlay: 'none', moveTarget: null }),
      closeMenu: () => set({ menu: null }),
      launchVisit: (ref) => {
        useGameStore.getState().chooseVisit(ref)
        set({ menu: null, tour: -1 })
      },
      setTour: (index) => set({ tour: index }),
      setWorldReady: (world) => set({ worldReady: world }),
      visitStation: (id) =>
        set((s) => {
          const key = getVisit(s.visit).key
          return { progress: { ...s.progress, [key]: markVisited(currentProgress(s), id) } }
        }),
      resetProgress: () =>
        set((s) => {
          const key = getVisit(s.visit).key
          return {
            progress: { ...s.progress, [key]: emptyProgress },
            finalesShown: s.finalesShown.filter((k) => k !== key),
          }
        }),
      setNearbyStation: (n) => set({ nearbyStation: n }),
      setMoveTarget: (t) => set({ moveTarget: t }),
      openStation: (n) =>
        set((s) => {
          const visit = getVisit(s.visit)
          const station = stationAtDesk(visit, n)
          return {
            activeStation: n,
            moveTarget: null,
            progress: station
              ? { ...s.progress, [visit.key]: markVisited(currentProgress(s), station.id) }
              : s.progress,
          }
        }),
      closeStation: () => set({ activeStation: null, annotationRequest: null }),
      setSheetWidth: (px) => set({ sheetWidth: px }),
      // Le catalogue remplace la vue 3D : on quitte l'écran éventuellement zoomé.
      openCatalog: (station = null) =>
        set({ overlay: 'catalog', catalogStation: station, activeStation: null }),
      openGlossary: (termId = null) => set({ overlay: 'glossary', glossaryFocus: termId }),
      openFinale: () =>
        set((s) => {
          const key = getVisit(s.visit).key
          return {
            overlay: 'finale',
            activeStation: null,
            finalesShown: s.finalesShown.includes(key) ? s.finalesShown : [...s.finalesShown, key],
          }
        }),
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
      version: 2,
      storage: createJSONStorage(() => safeStorage),
      // Seuls les réglages, la visite choisie et la progression sont mémorisés.
      partialize: (s) => ({
        settings: s.settings,
        visit: s.visit,
        progress: s.progress,
        finalesShown: s.finalesShown,
      }),
      migrate: migrateStored,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Persisted>
        const visit = p.visit && isKnownVisit(p.visit) ? p.visit : null
        // `welcomed` (avant le menu de lancement) n'est plus un réglage.
        const settings: Partial<Settings> & { welcomed?: boolean } = { ...p.settings }
        delete settings.welcomed
        return {
          ...current,
          settings: { ...current.settings, ...settings },
          visit,
          progress: sanitizeAllProgress(p.progress),
          finalesShown: Array.isArray(p.finalesShown)
            ? p.finalesShown.filter((k): k is string => typeof k === 'string')
            : [],
        }
      },
    },
  ),
)

// Accès depuis la console du navigateur (et les tests de bout en bout), en dev uniquement.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { __atelier: typeof useGameStore }).__atelier = useGameStore
}

/** Le visiteur peut-il se déplacer (ni menu, ni présentation, ni zoom, ni panneau ouvert) ? */
export const isExploring = (
  s: Pick<GameState, 'activeStation' | 'overlay' | 'menu' | 'tour'>,
): boolean => s.activeStation === null && s.overlay === 'none' && s.menu === null && s.tour === null

type Persisted = Pick<GameState, 'settings' | 'visit' | 'progress' | 'finalesShown'>

/** Progression de la visite en cours. */
export function currentProgress(s: Pick<GameState, 'visit' | 'progress'>): Progress {
  return s.progress[getVisit(s.visit).key] ?? emptyProgress
}

/** Nettoie les progressions relues du stockage (visites disparues, postes renommés). */
function sanitizeAllProgress(raw: unknown): Record<string, Progress> {
  if (typeof raw !== 'object' || raw === null) return {}
  const out: Record<string, Progress> = {}
  for (const [key, value] of Object.entries(raw)) {
    const [structure = '', scenario = ''] = key.split('/')
    if (!isKnownVisit({ structure, scenario })) continue
    const roles = findStructure(structure)!.roles.map((r) => r.id)
    out[key] = sanitizeProgress(value, roles)
  }
  return out
}

/** Version 1 : une seule visite (Atelier Lumen, la fonctionnalité réclamée par les utilisateurs). */
function migrateStored(persisted: unknown, version: number): unknown {
  if (version >= 2 || typeof persisted !== 'object' || persisted === null) return persisted
  type OldSettings = Settings & { finaleShown?: boolean; welcomed?: boolean }
  const old = persisted as { settings?: OldSettings; progress?: unknown }
  const first = { structure: 'atelier-lumen', scenario: 'retours-utilisateurs' }
  const key = visitKey(first)
  const { finaleShown, ...settings } = old.settings ?? ({} as OldSettings)
  return {
    settings,
    visit: settings.welcomed ? first : null,
    progress: old.progress ? { [key]: old.progress } : {},
    finalesShown: finaleShown ? [key] : [],
  }
}
