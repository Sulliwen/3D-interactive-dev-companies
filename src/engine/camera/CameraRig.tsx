import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { useAfterPhysicsStep, useRapier } from '@react-three/rapier'
import { MathUtils, Matrix4, Quaternion, Vector3, type PerspectiveCamera } from 'three'
import { floorPlan } from '../world/floorplan'
import { readMoveInput } from '../player/input'
import { runtime } from '../runtime'
import { isExploring, useGameStore } from '../../state/useGameStore'
import { computeScreenPose } from './screenPose'

const HEAD_HEIGHT = 1.55
const SHOULDER_OFFSET = 0.35
const MIN_DISTANCE = 1.6
const MAX_DISTANCE = 6.5
const MIN_PITCH = MathUtils.degToRad(-10)
const MAX_PITCH = MathUtils.degToRad(40)
const PROBE_RADIUS = 0.2
const DRAG_SENSITIVITY = 0.005
const ARROW_TURN_SPEED = 1.8
/** Durée du passage avatar ↔ écran, en secondes. */
const TRANSITION = 0.8

type Mode = 'follow' | 'toScreen' | 'screen' | 'toFollow'

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * Caméra de la visite.
 * - En balade : derrière l'épaule de l'avatar. Elle tourne en glissant la souris,
 *   zoome à la molette et se rapproche quand un obstacle s'interpose.
 * - Devant un poste : elle quitte l'avatar et vient se placer face à l'écran,
 *   cadré à gauche de la fiche du poste.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const domElement = useThree((s) => s.gl.domElement)
  const size = useThree((s) => s.size)
  const { world, rapier } = useRapier()

  const orbit = useRef({
    yaw: floorPlan.spawn.rotationY,
    pitch: MathUtils.degToRad(18),
    distance: 4,
  })
  const follow = useRef({ distance: 4, initialized: false })
  const rig = useRef({ mode: 'follow' as Mode, t: 0 })
  const probe = useMemo(() => new rapier.Ball(PROBE_RADIUS), [rapier])
  const tmp = useMemo(
    () => ({
      head: new Vector3(),
      dir: new Vector3(),
      target: new Vector3(),
      look: new Vector3(),
      followQuat: new Quaternion(),
      screenPos: new Vector3(),
      screenQuat: new Quaternion(),
      fromPos: new Vector3(),
      fromQuat: new Quaternion(),
      matrix: new Matrix4(),
    }),
    [],
  )

  useEffect(() => {
    let dragging = false
    let lastX = 0
    let lastY = 0
    const exploring = () => isExploring(useGameStore.getState())
    const down = (e: PointerEvent) => {
      if ((e.button !== 0 && e.button !== 2) || !exploring()) return
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      const o = orbit.current
      o.yaw -= (e.clientX - lastX) * DRAG_SENSITIVITY
      o.pitch = MathUtils.clamp(
        o.pitch + (e.clientY - lastY) * DRAG_SENSITIVITY,
        MIN_PITCH,
        MAX_PITCH,
      )
      lastX = e.clientX
      lastY = e.clientY
    }
    const up = () => {
      dragging = false
    }
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      if (!exploring()) return
      const o = orbit.current
      o.distance = MathUtils.clamp(
        o.distance * (1 + Math.sign(e.deltaY) * 0.1),
        MIN_DISTANCE,
        MAX_DISTANCE,
      )
    }
    const contextMenu = (e: Event) => {
      e.preventDefault()
      // Clic droit devant un écran : retour à l'avatar.
      const store = useGameStore.getState()
      if (store.activeStation !== null) store.closeStation()
    }

    domElement.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    domElement.addEventListener('wheel', wheel, { passive: false })
    domElement.addEventListener('contextmenu', contextMenu)
    return () => {
      domElement.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      domElement.removeEventListener('wheel', wheel)
      domElement.removeEventListener('contextmenu', contextMenu)
    }
  }, [domElement])

  useAfterPhysicsStep((w) => {
    const dt = Math.min(w.timestep, 1 / 20)
    const store = useGameStore.getState()
    const { reducedMotion } = store.settings
    const o = orbit.current
    const c = follow.current
    const {
      head,
      dir,
      target,
      look,
      followQuat,
      screenPos,
      screenQuat,
      fromPos,
      fromQuat,
      matrix,
    } = tmp

    // --- Pose « derrière l'épaule » (calculée en permanence) --------------------
    if (isExploring(store)) o.yaw -= readMoveInput().turn * ARROW_TURN_SPEED * dt
    runtime.cameraYaw = o.yaw

    head.copy(runtime.playerPosition).y += HEAD_HEIGHT
    const cosP = Math.cos(o.pitch)
    dir.set(-Math.sin(o.yaw) * cosP, Math.sin(o.pitch), -Math.cos(o.yaw) * cosP)
    const rightX = -Math.cos(o.yaw)
    const rightZ = Math.sin(o.yaw)
    target
      .copy(head)
      .addScaledVector(dir, o.distance)
      .add({ x: rightX * SHOULDER_OFFSET, y: 0, z: rightZ * SHOULDER_OFFSET })
    dir.subVectors(target, head)
    const wanted = dir.length()
    dir.divideScalar(wanted)

    // Lancer d'une sphère tête → caméra ; le visiteur (corps cinématique) est ignoré.
    const hit = world.castShape(
      head,
      { x: 0, y: 0, z: 0, w: 1 },
      dir,
      probe,
      0,
      wanted,
      true,
      rapier.QueryFilterFlags.EXCLUDE_KINEMATIC,
    )
    const free = hit ? Math.max(0.15, hit.time_of_impact - 0.05) : wanted
    // On se rapproche immédiatement d'un obstacle, on s'en éloigne en douceur.
    if (!c.initialized || reducedMotion || free < c.distance) c.distance = free
    else c.distance += (free - c.distance) * (1 - Math.exp(-4 * dt))

    target.copy(head).addScaledVector(dir, c.distance)
    const shoulder = (SHOULDER_OFFSET * c.distance) / wanted
    look.set(head.x + rightX * shoulder, head.y, head.z + rightZ * shoulder)
    followQuat.setFromRotationMatrix(matrix.lookAt(target, look, camera.up))

    // --- Pose face à l'écran du poste actif -------------------------------------
    const anchor =
      store.activeStation === null
        ? undefined
        : floorPlan.stations.find((s) => s.number === store.activeStation)
    if (anchor) {
      const pose = computeScreenPose(anchor, {
        fovDeg: camera.fov,
        aspect: size.width / size.height,
        availableFraction: 1 - store.sheetWidth / size.width,
      })
      screenPos.set(...pose.position)
      look.set(screenPos.x + pose.direction[0], screenPos.y, screenPos.z + pose.direction[2])
      screenQuat.setFromRotationMatrix(matrix.lookAt(screenPos, look, camera.up))
    }

    // --- Changements de mode ----------------------------------------------------
    const r = rig.current
    const start = (mode: Mode) => {
      r.mode = mode
      r.t = 0
      fromPos.copy(camera.position)
      fromQuat.copy(camera.quaternion)
    }
    if (anchor && (r.mode === 'follow' || r.mode === 'toFollow')) start('toScreen')
    if (!anchor && (r.mode === 'screen' || r.mode === 'toScreen')) start('toFollow')

    // --- Application ------------------------------------------------------------
    if (r.mode === 'follow') {
      if (!c.initialized || reducedMotion) camera.position.copy(target)
      else camera.position.lerp(target, 1 - Math.exp(-14 * dt))
      camera.lookAt(look.set(head.x + rightX * shoulder, head.y, head.z + rightZ * shoulder))
    } else if (r.mode === 'screen') {
      camera.position.copy(screenPos)
      camera.quaternion.copy(screenQuat)
    } else {
      r.t = reducedMotion ? 1 : Math.min(1, r.t + dt / TRANSITION)
      const e = easeInOutCubic(r.t)
      const toScreen = r.mode === 'toScreen'
      camera.position.lerpVectors(fromPos, toScreen ? screenPos : target, e)
      camera.quaternion.slerpQuaternions(fromQuat, toScreen ? screenQuat : followQuat, e)
      if (r.t >= 1) r.mode = toScreen ? 'screen' : 'follow'
    }
    c.initialized = true
    runtime.cameraPosition.copy(camera.position)
    runtime.cameraMode = r.mode
  })

  return null
}
