import { useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { floorPlan, type BoxElement, type MaterialKey } from './floorplan'
import { FLOORS, MATERIALS } from './materials'
import { useGameStore } from '../../state/useGameStore'

/**
 * Rendu en boîtes de l'étage. Toutes les boîtes d'un même matériau sont dessinées
 * en une seule instance (un appel de dessin par matériau).
 */
export function Blockout({ shadows }: { shadows: boolean }) {
  const groups = useMemo(() => {
    const map = new Map<MaterialKey, BoxElement[]>()
    for (const box of floorPlan.boxes) {
      const list = map.get(box.material) ?? []
      list.push(box)
      map.set(box.material, list)
    }
    return [...map.entries()]
  }, [])

  return (
    <group>
      <Floors />
      {groups.map(([key, boxes]) => {
        const spec = MATERIALS[key]
        const transparent = spec.opacity !== undefined
        const cast = shadows && spec.castShadow !== false
        return (
          <Instances
            key={key}
            limit={boxes.length}
            castShadow={cast}
            receiveShadow={shadows && !transparent}
          >
            <boxGeometry />
            <meshStandardMaterial
              // Couleur portée par chaque instance : le matériau reste blanc.
              color="#ffffff"
              roughness={spec.roughness}
              metalness={spec.metalness ?? 0}
              transparent={transparent}
              opacity={spec.opacity ?? 1}
              depthWrite={!transparent}
              emissive={spec.emissive ?? '#000000'}
              emissiveIntensity={spec.emissive ? 0.6 : 0}
            />
            {boxes.map((b) => (
              <Instance
                key={b.name}
                name={b.name}
                position={b.position}
                rotation={[0, b.rotationY ?? 0, 0]}
                scale={b.size}
                color={b.color ?? spec.color}
              />
            ))}
          </Instances>
        )
      })}
    </group>
  )
}

/** Sols : béton ciré partout, moquettes et parquet par zones. Cliquables pour se déplacer. */
function Floors() {
  const setMoveTarget = useGameStore((s) => s.setMoveTarget)
  const clickToMove = useGameStore((s) => s.settings.clickToMove)

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    // `delta` : distance parcourue par la souris depuis l'appui. Au-delà, c'était
    // un glissé pour tourner la caméra, pas un clic.
    if (!clickToMove || e.button !== 0 || e.delta > 6) return
    e.stopPropagation()
    setMoveTarget([e.point.x, 0, e.point.z])
  }

  return (
    <group onClick={onClick}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow name="floor_main">
        <planeGeometry args={[floorPlan.width, floorPlan.depth]} />
        <meshStandardMaterial color={FLOORS.concrete} roughness={0.55} />
      </mesh>
      {floorPlan.zones.map((z) => {
        const w = z.max[0] - z.min[0]
        const d = z.max[1] - z.min[1]
        return (
          <mesh
            key={z.id}
            name={`floor_${z.id}`}
            rotation-x={-Math.PI / 2}
            position={[z.min[0] + w / 2, 0.004, z.min[1] + d / 2]}
            receiveShadow
          >
            <planeGeometry args={[w, d]} />
            <meshStandardMaterial color={FLOORS[z.floor]} roughness={0.95} />
          </mesh>
        )
      })}
    </group>
  )
}
