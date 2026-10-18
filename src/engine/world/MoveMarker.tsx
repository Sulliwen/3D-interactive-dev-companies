import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import { useGameStore } from '../../state/useGameStore'

/** Cercle au sol qui montre la destination d'un clic. */
export function MoveMarker() {
  const target = useGameStore((s) => s.moveTarget)
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion)
  const ring = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    if (!ring.current || reducedMotion) return
    const s = 1 + Math.sin(clock.elapsedTime * 5) * 0.08
    ring.current.scale.set(s, s, s)
  })

  if (!target) return null
  return (
    <mesh ref={ring} position={[target[0], 0.02, target[2]]} rotation-x={-Math.PI / 2}>
      <ringGeometry args={[0.18, 0.26, 32]} />
      <meshBasicMaterial color="#f2a541" transparent opacity={0.9} depthWrite={false} />
    </mesh>
  )
}
