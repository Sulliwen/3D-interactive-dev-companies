import { useLayoutEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { suspend } from 'suspend-react'
import { Mesh, MeshStandardMaterial, SRGBColorSpace, type Material, type Texture } from 'three'
import { worldModels, type OfficeMeta } from './officeMeta'
import { getKtx2, withKtx2 } from '../ktx2'

/**
 * L'étage modélisé dans Blender (passe artistique) : public/models/<monde>/office.glb,
 * produit par `npm run art:build`. L'éclairage y est précalculé dans des lightmaps (second jeu d'UV) :
 * rendu final = couleur du matériau × lumière précalculée, sans calcul coûteux par image.
 */

/** Part de l'éclairage d'environnement gardée sur les surfaces précalculées (reflets). */
const STATIC_ENV_INTENSITY = 0.25

export function OfficeModel({ world, meta }: { world: string; meta: OfficeMeta }) {
  const gl = useThree((s) => s.gl)
  const dir = worldModels(world)
  const { scene } = useGLTF(`${dir}office.glb`, false, true, withKtx2(gl))
  const entries = useMemo(() => Object.entries(meta.lightmaps), [meta])
  const lightmaps = suspend(
    () => Promise.all(entries.map(([, lm]) => getKtx2(gl).loadAsync(`${dir}${lm.file}`))),
    ['office-lightmaps', dir, ...entries.map(([, lm]) => lm.file)],
  ) as Texture[]

  useLayoutEffect(() => {
    entries.forEach(([node, lm], i) => {
      const texture = lightmaps[i]!
      texture.channel = 1 // second jeu d'UV (TEXCOORD_1)
      texture.colorSpace = SRGBColorSpace
      const group = scene.getObjectByName(node)
      // Un même matériau peut servir à plusieurs groupes : une copie par groupe.
      const copies = new Map<Material, Material>()
      group?.traverse((o) => {
        if (!(o instanceof Mesh) || !(o.material instanceof MeshStandardMaterial)) return
        let copy = copies.get(o.material)
        if (!copy) {
          const m = o.material.clone()
          m.lightMap = texture
          // Les valeurs ont été divisées par `scale` à l'encodage ; π : convention de three.js
          // pour un éclairement diffus.
          m.lightMapIntensity = lm.scale * Math.PI
          m.envMapIntensity = STATIC_ENV_INTENSITY
          copies.set(o.material, m)
          copy = m
        }
        o.material = copy
      })
    })
    scene.traverse((o) => {
      // Décor immobile : pas besoin de recalculer ses matrices à chaque image.
      o.matrixAutoUpdate = false
      o.updateMatrix()
      if (
        o instanceof Mesh &&
        o.material instanceof MeshStandardMaterial &&
        o.material.transparent
      ) {
        o.material.depthWrite = false
      }
    })
    scene.updateMatrixWorld(true)
    if (import.meta.env.DEV) (window as unknown as { __office: unknown }).__office = scene
  }, [scene, lightmaps, entries])

  return <primitive object={scene} />
}
