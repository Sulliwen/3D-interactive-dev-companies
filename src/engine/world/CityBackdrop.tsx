import { useMemo } from 'react'
import { CanvasTexture, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from 'three'
import { Instance, Instances } from '@react-three/drei'

/**
 * Ville provisoire derrière les baies vitrées (nord et est), en attendant un HDRI
 * ou une image de fond. Une seule instance : un appel de dessin.
 */
/** L'étage est au 9e : le sol de la ville est bien plus bas que le plancher. */
const GROUND_Y = -30

export function CityBackdrop() {
  const buildings = useMemo(() => {
    const list: Array<{ x: number; z: number; w: number; d: number; h: number; tint: string }> = []
    let seed = 7
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    const tints = ['#c8ccd2', '#b7bec8', '#d6d2cb', '#a9b3bf', '#e0ddd6']
    const place = (x: number, z: number) => {
      const w = 6 + rand() * 10
      const d = 6 + rand() * 10
      list.push({
        x,
        z,
        w,
        d,
        h: 12 + rand() * 50,
        tint: tints[Math.floor(rand() * tints.length)]!,
      })
    }
    for (let row = 0; row < 4; row++) {
      for (let x = -110; x <= 130; x += 18) place(x + rand() * 6, -48 - row * 26 - rand() * 8)
      for (let z = -90; z <= 70; z += 18) place(48 + row * 26 + rand() * 8, z + rand() * 6)
    }
    return list
  }, [])

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, GROUND_Y, 0]}>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#9aa29a" roughness={1} />
      </mesh>
      <Instances limit={buildings.length}>
        <boxGeometry />
        <primitive object={facadeMaterial} attach="material" />
        {buildings.map((b, i) => (
          <Instance
            key={i}
            position={[b.x, GROUND_Y + b.h / 2, b.z]}
            scale={[b.w, b.h, b.d]}
            color={b.tint}
          />
        ))}
      </Instances>
    </group>
  )
}

/** Une travée de façade (3 m × 3,2 m) : allège en béton clair, vitrage sombre. */
function facadeTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#e4e2dd'
    ctx.fillRect(0, 0, 64, 64)
    const glass = ctx.createLinearGradient(0, 8, 0, 52)
    glass.addColorStop(0, '#7f93a6')
    glass.addColorStop(1, '#4f6172')
    ctx.fillStyle = glass
    ctx.fillRect(6, 10, 52, 40)
    ctx.fillStyle = '#d8d6d0'
    ctx.fillRect(31, 10, 2, 40)
  }
  const t = new CanvasTexture(canvas)
  t.wrapS = t.wrapT = RepeatWrapping
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 4
  return t
}

/**
 * Matériau des immeubles : la texture de façade est plaquée en coordonnées monde (une
 * fenêtre tous les 3 m, un étage tous les 3,2 m), quelle que soit la taille de l'immeuble,
 * pour rester en un seul appel de dessin (instances).
 */
const facadeMaterial = (() => {
  const m = new MeshStandardMaterial({ map: facadeTexture(), roughness: 0.55, metalness: 0.15 })
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vCityPos;\nvarying vec3 vCityNormal;',
      )
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
        mat4 cityModel = modelMatrix;
        #ifdef USE_INSTANCING
          cityModel = modelMatrix * instanceMatrix;
        #endif
        vCityPos = (cityModel * vec4(transformed, 1.0)).xyz;
        vCityNormal = normalize(mat3(cityModel) * objectNormal);`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vCityPos;\nvarying vec3 vCityNormal;',
      )
      .replace(
        '#include <map_fragment>',
        `vec3 cn = abs(vCityNormal);
        if (cn.y < 0.5) {
          vec2 cuv = (cn.x > cn.z ? vCityPos.zy : vCityPos.xy) / vec2(3.0, 3.2);
          diffuseColor *= texture2D(map, cuv);
        }`,
      )
  }
  return m
})()
