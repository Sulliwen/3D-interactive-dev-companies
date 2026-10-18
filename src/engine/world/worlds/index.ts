import { getVisit, structures } from '../../../content/loader'
import { useVisit } from '../../../state/visit'
import { useGameStore } from '../../../state/useGameStore'
import { atelierLumen } from './atelier-lumen'
import { studioLanterne } from './studio-lanterne'
import type { WorldDef } from './types'

export type { WorldDef } from './types'

/** Les mondes connus, par identifiant (`world` dans structure.json). */
export const WORLDS: Record<string, WorldDef> = {
  [atelierLumen.id]: atelierLumen,
  [studioLanterne.id]: studioLanterne,
}

/** Le monde d'une structure. */
export function worldOf(structureId: string): WorldDef {
  const id = structures.find((b) => b.structure.id === structureId)?.structure.world
  const world = id ? WORLDS[id] : undefined
  if (!world) throw new Error(`Aucun monde pour la structure « ${structureId} »`)
  return world
}

/** Le monde de la visite en cours, hors de React (boucle de rendu, calculs). */
export function currentWorld(): WorldDef {
  return worldOf(getVisit(useGameStore.getState().visit).structure.id)
}

/** Le monde de la visite en cours. */
export function useWorld(): WorldDef {
  return worldOf(useVisit().structure.id)
}
