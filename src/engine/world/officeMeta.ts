import { suspend } from 'suspend-react'

const BASE = import.meta.env.BASE_URL

export interface OfficeMeta {
  /** Nœud du modèle → lightmap (fichier KTX2, échelle des valeurs encodées). */
  lightmaps: Record<string, { file: string; scale: number }>
}

/** Dossier des modèles d'un monde (public/models/<monde>/). */
export const worldModels = (world: string) => `${BASE}models/${world}/`

/** Description du modèle d'un monde, ou `null` s'il n'a pas encore été produit (étage en boîtes). */
export function useOfficeMeta(world: string): OfficeMeta | null {
  return suspend(async () => {
    try {
      const res = await fetch(`${worldModels(world)}office.json`)
      if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null
      return (await res.json()) as OfficeMeta
    } catch {
      return null
    }
  }, ['office-meta', world])
}
