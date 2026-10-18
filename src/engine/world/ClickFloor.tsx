import type { ThreeEvent } from '@react-three/fiber'
import { useWorld } from './worlds'
import { useGameStore } from '../../state/useGameStore'

/**
 * Surface invisible au ras du sol qui reçoit les clics « aller ici » (le modèle Blender,
 * lui, n'a pas de gestionnaire de clic : on ne veut pas viser un meuble).
 */
export function ClickFloor() {
  const floorPlan = useWorld().plan
  const setMoveTarget = useGameStore((s) => s.setMoveTarget)
  const clickToMove = useGameStore((s) => s.settings.clickToMove)

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!clickToMove || e.button !== 0 || e.delta > 6) return
    e.stopPropagation()
    setMoveTarget([e.point.x, 0, e.point.z])
  }

  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.002} onClick={onClick}>
      <planeGeometry args={[floorPlan.width, floorPlan.depth]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
  )
}
