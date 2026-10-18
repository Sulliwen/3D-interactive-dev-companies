import { useMemo } from 'react'
import { CanvasTexture, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from 'three'
import { Instance, Instances } from '@react-three/drei'
import { useWorld } from './worlds'

/** Les immeubles vus par les fenêtres de l'étage (nord et est). */
export interface BackdropSpec {
  /** Hauteur du sol de la rue sous le plancher de l'étage (-30 : au 9e étage). */
  groundY: number
  ground: string
  /** Distance de la première rangée d'immeubles au centre de l'étage. */
  near: number
  rows: number
  rowGap: number
  /** Hauteur des immeubles : minimum, et écart aléatoire au-dessus. */
  height: readonly [min: number, spread: number]
  tints: readonly string[]
  /** Façade : allège et vitrage (une travée de 3 m × 3,2 m). */
  facade: { wall: string; glass: readonly [top: string, bottom: string] }
}

/**
 * Immeubles derrière les fenêtres (nord et est), propres à chaque monde. Une seule
 * instance : un appel de dessin.
 */
export function CityBackdrop() {
  const spec = useWorld().backdrop
  const facadeMaterial = useMemo(() => cityMaterial(spec), [spec])
  const buildings = useMemo(() => {
    const list: Array<{ x: number; z: number; w: number; d: number; h: number; tint: string }> = []
    let seed = 7
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    const { tints, near, rows, rowGap, height } = spec
    const place = (x: number, z: number) => {
      const w = 6 + rand() * 10
      const d = 6 + rand() * 10
      list.push({
        x,
        z,
        w,
        d,
        h: height[0] + rand() * height[1],
        tint: tints[Math.floor(rand() * tints.length)]!,
      })
    }
    for (let row = 0; row < rows; row++) {
      for (let x = -110; x <= 130; x += 18) place(x + rand() * 6, -near - row * rowGap - rand() * 8)
      for (let z = -90; z <= 70; z += 18) place(near + row * rowGap + rand() * 8, z + rand() * 6)
    }
    return list
  }, [spec])
  const groundY = spec.groundY

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, groundY, 0]}>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color={spec.ground} roughness={1} />
      </mesh>
      <Instances limit={buildings.length}>
        <boxGeometry />
        <primitive object={facadeMaterial} attach="material" />
        {buildings.map((b, i) => (
          <Instance
            key={i}
            position={[b.x, groundY + b.h / 2, b.z]}
            scale={[b.w, b.h, b.d]}
            color={b.tint}
          />
        ))}
      </Instances>
    </group>
  )
}

/** Une travée de façade (3 m × 3,2 m) : allège, vitrage. */
function facadeTexture({ facade }: BackdropSpec): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = facade.wall
    ctx.fillRect(0, 0, 64, 64)
    const glass = ctx.createLinearGradient(0, 8, 0, 52)
    glass.addColorStop(0, facade.glass[0])
    glass.addColorStop(1, facade.glass[1])
    ctx.fillStyle = glass
    ctx.fillRect(6, 10, 52, 40)
    ctx.fillStyle = facade.wall
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
function cityMaterial(spec: BackdropSpec): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ map: facadeTexture(spec), roughness: 0.55, metalness: 0.15 })
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
}
