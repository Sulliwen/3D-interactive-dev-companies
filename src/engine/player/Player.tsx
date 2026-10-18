import { Suspense, useEffect, useMemo, useRef } from 'react'
import type { KinematicCharacterController } from '@dimforge/rapier3d-compat'
import { useFrame } from '@react-three/fiber'
import {
  CapsuleCollider,
  RigidBody,
  useBeforePhysicsStep,
  useRapier,
  type RapierCollider,
  type RapierRigidBody,
} from '@react-three/rapier'
import { CanvasTexture, MathUtils, type Group } from 'three'
import type { Vec2, Vec3 } from '../world/floorplan'
import { useWorld } from '../world/worlds'
import { getNavGrid } from '../nav'
import { findPath } from '../nav/navGrid'
import { findNearbyStation } from '../stations/proximity'
import { runtime } from '../runtime'
import { isExploring, useGameStore } from '../../state/useGameStore'
import { readMoveInput } from './input'
import { useCharactersAvailable } from '../characters/assets'
import { VisitorAvatar } from '../characters/VisitorAvatar'

export const PLAYER_RADIUS = 0.3
const HALF_HEIGHT = 0.55
/** Hauteur du centre de la capsule au-dessus du sol. */
const CENTER_Y = HALF_HEIGHT + PLAYER_RADIUS
const WALK_SPEED = 1.6
const RUN_SPEED = 3.2
const GRAVITY = 9.81
const ARRIVAL_DISTANCE = 0.25
const WAYPOINT_REACHED = 0.35

export function Player() {
  const floorPlan = useWorld().plan
  const body = useRef<RapierRigidBody>(null)
  const collider = useRef<RapierCollider>(null)
  const visual = useRef<Group>(null)
  const { world } = useRapier()

  // Créé dans un effet (et non un useMemo) : en mode strict, React rejoue les effets
  // et libérerait sinon un contrôleur encore utilisé.
  const controller = useRef<KinematicCharacterController | null>(null)
  useEffect(() => {
    const c = world.createCharacterController(0.02)
    c.setSlideEnabled(true)
    c.enableAutostep(0.25, 0.2, false)
    c.enableSnapToGround(0.3)
    c.setMaxSlopeClimbAngle(MathUtils.degToRad(45))
    controller.current = c
    return () => {
      controller.current = null
      world.removeCharacterController(c)
    }
  }, [world])

  const route = useRef<{ target: Vec3 | null; points: Vec2[]; index: number }>({
    target: null,
    points: [],
    index: 0,
  })
  const motion = useRef({ vx: 0, vz: 0, vy: 0, yaw: floorPlan.spawn.rotationY, stuckTime: 0 })
  const [sx, , sz] = floorPlan.spawn.position

  useBeforePhysicsStep((w) => {
    const rb = body.current
    const col = collider.current
    const kcc = controller.current
    if (!rb || !col || !kcc) return
    const dt = Math.min(w.timestep, 1 / 20)
    const m = motion.current
    const store = useGameStore.getState()
    const exploring = isExploring(store)
    const input = exploring ? readMoveInput() : { x: 0, forward: 0, turn: 0, run: false }
    const pos = rb.translation()

    // Direction voulue, dans le plan horizontal.
    let dirX = 0
    let dirZ = 0
    const usingKeys = input.x !== 0 || input.forward !== 0
    if (usingKeys) {
      if (store.moveTarget) store.setMoveTarget(null)
      const fx = Math.sin(runtime.cameraYaw)
      const fz = Math.cos(runtime.cameraYaw)
      // Droite de la caméra = avant tourné de -90° autour de Y.
      dirX = fx * input.forward - fz * input.x
      dirZ = fz * input.forward + fx * input.x
    } else if (store.moveTarget && exploring) {
      // Nouvelle destination : calculer l'itinéraire qui contourne les obstacles.
      const r = route.current
      if (r.target !== store.moveTarget) {
        const t = store.moveTarget
        r.target = t
        r.points = findPath(getNavGrid(), [pos.x, pos.z], [t[0], t[2]]) ?? [[t[0], t[2]]]
        r.index = r.points.length > 1 ? 1 : 0
        m.stuckTime = 0
      }
      let [wx, wz] = r.points[r.index]!
      let dist = Math.hypot(wx - pos.x, wz - pos.z)
      // Étape intermédiaire atteinte : viser la suivante.
      while (dist < WAYPOINT_REACHED && r.index < r.points.length - 1) {
        r.index += 1
        ;[wx, wz] = r.points[r.index]!
        dist = Math.hypot(wx - pos.x, wz - pos.z)
      }
      const last = r.index === r.points.length - 1
      if (last && dist < ARRIVAL_DISTANCE) store.setMoveTarget(null)
      else if (dist > 1e-4) {
        // Ralentir à l'approche de l'arrivée pour s'arrêter en douceur.
        const k = last ? Math.min(1, dist / 0.8) : 1
        dirX = ((wx - pos.x) / dist) * k
        dirZ = ((wz - pos.z) / dist) * k
      }
    }
    const len = Math.hypot(dirX, dirZ)
    if (len > 1) {
      dirX /= len
      dirZ /= len
    }

    const speed = input.run ? RUN_SPEED : WALK_SPEED
    const accel = 1 - Math.exp(-12 * dt)
    m.vx += (dirX * speed - m.vx) * accel
    m.vz += (dirZ * speed - m.vz) * accel
    m.vy -= GRAVITY * dt

    const desired = { x: m.vx * dt, y: m.vy * dt, z: m.vz * dt }
    kcc.computeColliderMovement(col, desired)
    const moved = kcc.computedMovement()
    if (kcc.computedGrounded()) m.vy = 0

    // Clic au sol : abandonner si un obstacle empêche d'avancer.
    const wanted = Math.hypot(desired.x, desired.z)
    if (!usingKeys && store.moveTarget && wanted > 1e-4) {
      const achieved = Math.hypot(moved.x, moved.z)
      m.stuckTime = achieved < wanted * 0.3 ? m.stuckTime + dt : 0
      if (m.stuckTime > 0.5) {
        store.setMoveTarget(null)
        m.stuckTime = 0
      }
    }

    // Sécurité : si l'on tombe sous le sol (bug de collision), retour à l'accueil.
    const next = { x: pos.x + moved.x, y: pos.y + moved.y, z: pos.z + moved.z }
    if (next.y < -5) {
      next.x = sx
      next.y = CENTER_Y
      next.z = sz
      m.vy = 0
    }
    rb.setNextKinematicTranslation(next)

    // L'avatar se tourne vers sa direction de marche.
    const horizontalSpeed = Math.hypot(m.vx, m.vz)
    if (horizontalSpeed > 0.15) {
      const targetYaw = Math.atan2(m.vx, m.vz)
      const delta = MathUtils.euclideanModulo(targetYaw - m.yaw + Math.PI, Math.PI * 2) - Math.PI
      m.yaw += delta * (1 - Math.exp(-10 * dt))
    }

    runtime.playerPosition.set(next.x, next.y - CENTER_Y, next.z)
    runtime.playerYaw = m.yaw
    runtime.playerSpeed = Math.hypot(moved.x, moved.z) / dt

    const nearby = exploring ? findNearbyStation([next.x, next.z], floorPlan.stations) : null
    if (nearby !== store.nearbyStation) store.setNearbyStation(nearby)
  })

  useFrame(() => {
    const v = visual.current
    if (!v) return
    v.rotation.y = motion.current.yaw
    // Caméra plaquée contre l'avatar (couloir, mur) : on le masque plutôt que de boucher la vue.
    v.visible = runtime.cameraPosition.distanceTo(runtime.playerPosition) > 1.8
  })

  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={[sx, CENTER_Y, sz]}
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider ref={collider} args={[HALF_HEIGHT, PLAYER_RADIUS]} />
      <group ref={visual}>
        <Suspense fallback={<ProvisionalAvatar />}>
          <AvatarModel />
        </Suspense>
      </group>
      <BlobShadow />
    </RigidBody>
  )
}

/** L'avatar choisi à l'accueil, ou la capsule si les personnages n'ont pas été produits. */
function AvatarModel() {
  const available = useCharactersAvailable()
  const avatar = useGameStore((s) => s.settings.avatar)
  if (!available) return <ProvisionalAvatar />
  return <VisitorAvatar key={avatar} id={avatar} offsetY={-CENTER_Y} />
}

/** Avatar provisoire : une capsule, un repère de face et le badge visiteur. */
function ProvisionalAvatar() {
  return (
    <group>
      <mesh castShadow>
        <capsuleGeometry args={[PLAYER_RADIUS, HALF_HEIGHT * 2, 6, 16]} />
        <meshStandardMaterial color="#3d5a80" roughness={0.6} />
      </mesh>
      {/* Visière : indique où l'avatar regarde. */}
      <mesh position={[0, 0.62, 0.22]} castShadow>
        <boxGeometry args={[0.32, 0.1, 0.16]} />
        <meshStandardMaterial color="#e0fbfc" roughness={0.3} />
      </mesh>
      {/* Badge visiteur. */}
      <mesh position={[0, 0.25, PLAYER_RADIUS + 0.005]}>
        <boxGeometry args={[0.12, 0.16, 0.01]} />
        <meshStandardMaterial color="#ee6c4d" />
      </mesh>
    </group>
  )
}

/**
 * Ombre douce sous les pieds : le décor a un éclairage précalculé, l'avatar n'y projette
 * pas d'ombre en temps réel ; cette tache suffit à le « poser » au sol.
 */
function BlobShadow() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 64
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
      g.addColorStop(0, 'rgba(0,0,0,0.45)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 64, 64)
    }
    return new CanvasTexture(canvas)
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <mesh position-y={-CENTER_Y + 0.012} rotation-x={-Math.PI / 2} renderOrder={1}>
      <planeGeometry args={[0.9, 0.9]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}
