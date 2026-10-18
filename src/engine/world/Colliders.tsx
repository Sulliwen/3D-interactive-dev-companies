import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { floorPlan } from './floorplan'
import { npcObstacles } from './npcs'

/** Collisions générées depuis le plan : un seul corps fixe, une boîte par obstacle. */
export function Colliders() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider
        name="col_floor"
        args={[floorPlan.width / 2, 0.1, floorPlan.depth / 2]}
        position={[0, -0.1, 0]}
      />
      {/* Plafond invisible : il garde la caméra à l'intérieur de l'étage. */}
      <CuboidCollider
        name="col_ceiling"
        args={[floorPlan.width / 2, 0.1, floorPlan.depth / 2]}
        position={[0, floorPlan.wallHeight + 0.1, 0]}
      />
      {[...floorPlan.boxes, ...npcObstacles]
        .filter((b) => b.collider)
        .map((b) => (
          <CuboidCollider
            key={b.name}
            name={b.name}
            args={[b.size[0] / 2, b.size[1] / 2, b.size[2] / 2]}
            position={b.position}
            rotation={[0, b.rotationY ?? 0, 0]}
          />
        ))}
    </RigidBody>
  )
}
