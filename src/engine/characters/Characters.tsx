import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import {
  AnimationMixer,
  Frustum,
  Matrix4,
  Sphere,
  Vector3,
  type AnimationClip,
  type Group,
} from 'three'
import { npcs, type NpcPlacement } from '../world/npcs'
import { useGameStore } from '../../state/useGameStore'
import { QUALITY } from '../quality'
import { usePreparedCharacter, useClips } from './assets'
import { characters, planCharacters, registerCharacter } from './manager'

/** Les collaborateurs et figurants de l'étage, animés en boucle. */
export function Characters() {
  const clips = useClips()
  return (
    <>
      {npcs.map((p) => (
        <Suspense key={p.id} fallback={null}>
          <Npc placement={p} clips={clips} />
        </Suspense>
      ))}
      <CharacterManager />
    </>
  )
}

/** Décalage stable dans l'animation, pour que personne ne bouge en même temps. */
function phase(id: string): number {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return (h % 1000) / 1000
}

function Npc({
  placement: p,
  clips,
}: {
  placement: NpcPlacement
  clips: Record<string, AnimationClip>
}) {
  const character = usePreparedCharacter(p.id)
  const group = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const g = group.current
    if (!g) return
    const mixer = new AnimationMixer(character.model)
    const clip = clips[p.clip] ?? clips.idle
    if (clip) {
      const action = mixer.clipAction(clip)
      action.play()
      action.time = phase(p.id) * clip.duration
      mixer.update(0)
    }
    const unregister = registerCharacter({
      group: g,
      mixer,
      lod0: character.lod0,
      lod1: character.lod1,
      station: p.station,
      pending: 0,
      distance: 0,
    })
    return () => {
      unregister()
      mixer.stopAllAction()
    }
  }, [character, clips, p])

  return (
    <group ref={group} position={[p.position[0], 0, p.position[1]]} rotation-y={p.rotationY}>
      <primitive object={character.model} />
      {/* Zone de survol invisible : affiche le prénom et le rôle. */}
      <mesh
        position-y={p.standing ? 0.9 : 0.75}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        <capsuleGeometry args={[0.3, p.standing ? 1.1 : 0.7, 4, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
      {hovered && (
        <Html
          position-y={p.standing ? 2.0 : 1.55}
          center
          zIndexRange={[5, 0]}
          className="npc-label"
        >
          <strong>{p.name}</strong>
          <span>{p.role}</span>
        </Html>
      )}
    </group>
  )
}

/** Une seule boucle pour tous : visibilité, niveau de détail et cadence d'animation. */
function CharacterManager() {
  const tmp = useMemo(
    () => ({ frustum: new Frustum(), m: new Matrix4(), sphere: new Sphere(new Vector3(), 1.1) }),
    [],
  )

  useFrame(({ camera }, delta) => {
    const { frustum, m, sphere } = tmp
    m.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    frustum.setFromProjectionMatrix(m)
    const { activeStation: active, settings } = useGameStore.getState()
    const items = characters.map((c) => {
      c.group.getWorldPosition(sphere.center)
      sphere.center.y += 0.9
      c.distance = camera.position.distanceTo(sphere.center)
      // Le titulaire s'efface quand on regarde son écran (la caméra prend sa place).
      return {
        distance: c.distance,
        inView: frustum.intersectsSphere(sphere),
        hidden: c.station === active,
      }
    })
    planCharacters(items, QUALITY[settings.quality].characters).forEach((plan, i) => {
      const c = characters[i]!
      c.group.visible = plan.visible
      if (c.lod0) c.lod0.visible = plan.lod === 0 || !c.lod1
      if (c.lod1) c.lod1.visible = plan.lod === 1
      if (plan.step === null) return
      c.pending += delta
      if (c.pending >= plan.step) {
        c.mixer.update(c.pending)
        c.pending = 0
      }
    })
  })

  return null
}
