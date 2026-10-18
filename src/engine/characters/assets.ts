import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { suspend } from 'suspend-react'
import { MeshStandardMaterial, type AnimationClip, type Object3D, type SkinnedMesh } from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { withKtx2 } from '../ktx2'

const BASE = import.meta.env.BASE_URL
export const characterUrl = (id: string) => `${BASE}models/characters/${id}.glb`
const ANIMATIONS_URL = `${BASE}models/characters/animations.glb`

/** Les personnages ont-ils été produits (`npm run art:characters`) ? */
export function useCharactersAvailable(): boolean {
  return suspend(async () => {
    try {
      const res = await fetch(ANIMATIONS_URL, { method: 'HEAD' })
      return res.ok && !res.headers.get('content-type')?.includes('text/html')
    } catch {
      return false
    }
  }, ['characters-available'])
}

/** Clips d'animation partagés par tous les personnages (même squelette). */
export function useClips(): Record<string, AnimationClip> {
  const gl = useThree((s) => s.gl)
  const { animations } = useGLTF(ANIMATIONS_URL, false, true, withKtx2(gl))
  return useMemo(() => Object.fromEntries(animations.map((a) => [a.name, a])), [animations])
}

export interface PreparedCharacter {
  model: Object3D
  lod0: SkinnedMesh | null
  lod1: SkinnedMesh | null
}

/** Copie indépendante d'un personnage chargé, avec ses deux niveaux de détail. */
export function usePreparedCharacter(id: string): PreparedCharacter {
  const gl = useThree((s) => s.gl)
  const { scene } = useGLTF(characterUrl(id), false, true, withKtx2(gl))
  return useMemo(() => {
    const model = cloneSkinned(scene)
    let lod0: SkinnedMesh | null = null
    let lod1: SkinnedMesh | null = null
    model.traverse((o) => {
      const mesh = o as SkinnedMesh
      if (!mesh.isSkinnedMesh) return
      // Les os bougent : la boîte englobante d'origine ne vaut plus. On gère la visibilité
      // nous-mêmes (CharacterManager).
      mesh.frustumCulled = false
      if (mesh.name.endsWith('_lod1')) lod1 = mesh
      else lod0 ??= mesh
      if (mesh.material instanceof MeshStandardMaterial) mesh.material.envMapIntensity = 1.1
    })
    return { model, lod0, lod1 }
  }, [scene])
}
