import { useLayoutEffect } from 'react'
import { useTexture } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { EquirectangularReflectionMapping, SRGBColorSpace } from 'three'

/** Ciel photographique (CC0, Poly Haven) : arrière-plan et reflets de la scène. */
export function SkyEnvironment({ intensity = 1 }: { intensity?: number }) {
  const texture = useTexture(`${import.meta.env.BASE_URL}textures/sky.jpg`)
  const scene = useThree((s) => s.scene)

  useLayoutEffect(() => {
    texture.mapping = EquirectangularReflectionMapping
    texture.colorSpace = SRGBColorSpace
    scene.background = texture
    scene.environment = texture
    scene.environmentIntensity = intensity
    return () => {
      scene.background = null
      scene.environment = null
    }
  }, [texture, scene, intensity])

  return null
}
