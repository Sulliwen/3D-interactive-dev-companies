import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial, type Mesh } from 'three'
import { getNavGrid } from '../nav'
import { findPath } from '../nav/navGrid'
import { runtime } from '../runtime'
import { standPoint } from '../stations/standPoint'
import { useNextStation } from '../stations/useNextStation'
import { isExploring, useGameStore } from '../../state/useGameStore'
import type { Vec2 } from './floorplan'

const WIDTH = 0.16
const HEIGHT = 0.015
/** En deçà de cette distance du poste, la ligne disparaît : on y est. */
const HIDE_NEAR = 1.2
const REFRESH = 0.3

/**
 * Parcours guidé : une ligne lumineuse discrète au sol, en tirets qui avancent,
 * du visiteur jusqu'au prochain poste du fil rouge (itinéraire qui contourne le mobilier).
 */
export function GuideLine() {
  const enabled = useGameStore((s) => s.settings.guidedPath)
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion)
  const next = useNextStation()
  const mesh = useRef<Mesh>(null)
  const state = useRef({ elapsed: REFRESH, from: [Infinity, Infinity] as Vec2, target: -1 })

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uLength: { value: 1 } },
        vertexShader: /* glsl */ `
          attribute float aDist;
          varying float vDist;
          varying float vSide;
          void main() {
            vDist = aDist;
            vSide = uv.y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform float uLength;
          varying float vDist;
          varying float vSide;
          void main() {
            float dash = smoothstep(0.0, 0.08, fract((vDist - uTime) / 0.6) - 0.35);
            float edge = 1.0 - smoothstep(0.55, 1.0, abs(vSide * 2.0 - 1.0));
            float ends = smoothstep(0.0, 0.8, vDist) * smoothstep(0.0, 0.6, uLength - vDist);
            float alpha = (0.35 + 0.6 * dash) * edge * ends;
            gl_FragColor = vec4(vec3(1.0, 0.68, 0.32) * 1.4, alpha);
          }`,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    const m = mesh.current
    if (!m) return
    if (!reducedMotion) material.uniforms.uTime!.value += delta * 0.5

    const s = state.current
    s.elapsed += delta
    if (s.elapsed < REFRESH) return
    s.elapsed = 0

    const store = useGameStore.getState()
    const p = runtime.playerPosition
    const target = next ? standPoint(next.anchor) : null
    const near = target && Math.hypot(target[0] - p.x, target[1] - p.z) < HIDE_NEAR
    if (!enabled || !next || !target || near || !isExploring(store)) {
      m.visible = false
      runtime.guidePath = null
      s.target = -1
      return
    }
    // Recalcul seulement si l'on a bougé ou si le poste visé a changé.
    const moved = Math.hypot(p.x - s.from[0], p.z - s.from[1])
    if (moved < 0.4 && s.target === next.number) {
      m.visible = true
      return
    }
    const path = findPath(getNavGrid(), [p.x, p.z], target)
    if (!path || path.length < 2) {
      m.visible = false
      runtime.guidePath = null
      return
    }
    s.from = [p.x, p.z]
    s.target = next.number
    runtime.guidePath = path
    const old = m.geometry
    m.geometry = ribbon(path)
    old.dispose()
    material.uniforms.uLength!.value = m.geometry.userData.length as number
    m.visible = true
  })

  return (
    <mesh ref={mesh} visible={false} material={material} renderOrder={1} frustumCulled={false} />
  )
}

/** Ruban plat posé au sol le long de l'itinéraire, avec la distance parcourue par sommet. */
function ribbon(points: readonly Vec2[]): BufferGeometry {
  const positions: number[] = []
  const uvs: number[] = []
  const dists: number[] = []
  const indices: number[] = []
  let travelled = 0
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i]!
    const [bx, bz] = points[i + 1]!
    const len = Math.hypot(bx - ax, bz - az)
    if (len < 1e-4) continue
    const nx = (-(bz - az) / len) * (WIDTH / 2)
    const nz = ((bx - ax) / len) * (WIDTH / 2)
    const base = positions.length / 3
    positions.push(
      ax + nx,
      HEIGHT,
      az + nz,
      ax - nx,
      HEIGHT,
      az - nz,
      bx + nx,
      HEIGHT,
      bz + nz,
      bx - nx,
      HEIGHT,
      bz - nz,
    )
    uvs.push(0, 0, 0, 1, 1, 0, 1, 1)
    dists.push(travelled, travelled, travelled + len, travelled + len)
    indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3)
    travelled += len
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2))
  g.setAttribute('aDist', new BufferAttribute(new Float32Array(dists), 1))
  g.setIndex(indices)
  g.userData.length = travelled
  return g
}
