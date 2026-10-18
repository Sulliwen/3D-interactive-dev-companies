import { suspend } from 'suspend-react'

const BASE = import.meta.env.BASE_URL

export interface OfficeMeta {
  /** Nœud du modèle → lightmap (fichier KTX2, échelle des valeurs encodées). */
  lightmaps: Record<string, { file: string; scale: number }>
}

/** Description du modèle, ou `null` s'il n'a pas encore été produit (étage en boîtes). */
export function useOfficeMeta(): OfficeMeta | null {
  return suspend(async () => {
    try {
      const res = await fetch(`${BASE}models/office.json`)
      if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null
      return (await res.json()) as OfficeMeta
    } catch {
      return null
    }
  }, ['office-meta'])
}
