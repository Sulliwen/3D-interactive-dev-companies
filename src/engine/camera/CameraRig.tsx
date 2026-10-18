import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { useAfterPhysicsStep, useRapier } from '@react-three/rapier'
import { MathUtils, Matrix4, Quaternion, Vector3, type PerspectiveCamera } from 'three'
import { useWorld } from '../world/worlds'
import { readMoveInput } from '../player/input'
import { runtime } from '../runtime'
import { isExploring, useGameStore } from '../../state/useGameStore'
import { getVisit } from '../../content/loader'
import { computeScreenPose, computeTourShot } from './screenPose'

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
/** Durée d'un déplacement d'un plan à l'autre pendant la présentation. */
const TOUR_FLIGHT = 1.6
/** Lent travelling avant pendant qu'un plan de la présentation reste affiché (m/s). */
const TOUR_DRIFT = 0.06

type Mode = 'follow' | 'toScreen' | 'screen' | 'toFollow' | 'toTour' | 'tour'

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * Caméra de la visite.
 * - En balade : derrière l'épaule de l'avatar. Elle tourne en glissant la souris,
 *   zoome à la molette et se rapproche quand un obstacle s'interpose.
 * - Devant un poste : elle quitte l'avatar et vient se placer face à l'écran,
 *   cadré à gauche de la fiche du poste.
 * - Pendant la présentation du scénario : vue d'ensemble, puis survol des postes du
 *   parcours dans l'ordre, avant de revenir derrière l'avatar.
 */
export function CameraRig() {
  const { plan: floorPlan, overview } = useWorld()
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
  const rig = useRef({ mode: 'follow' as Mode, t: 0, duration: TRANSITION, shot: '', hold: 0 })
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
      tourPos: new Vector3(),
      tourQuat: new Quaternion(),
      tourTarget: new Vector3(),
      tourFrom: new Vector3(),
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
      tourPos,
      tourQuat,
      tourTarget,
      tourFrom,
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

    // --- Plan de la présentation ------------------------------------------------
    let shotKey = ''
    if (store.tour !== null) {
      const station = getVisit(store.visit).pathStations[store.tour]
      const stationAnchor = station && floorPlan.stations.find((s) => s.number === station.desk)
      const shot = stationAnchor ? computeTourShot(stationAnchor) : overview
      shotKey = stationAnchor ? `poste-${stationAnchor.number}` : 'ensemble'
      tourTarget.set(...shot.target)
      tourPos.set(...shot.position)
      // Un mur ou une cloison entre le poste et la caméra : on se rapproche. Le test se
      // fait à hauteur de caméra, au-dessus des bureaux, des chaises et des personnes assises.
      tourFrom.set(tourTarget.x, tourPos.y, tourTarget.z)
      dir.subVectors(tourPos, tourFrom)
      const span = dir.length()
      dir.divideScalar(span)
      const blocked =
        stationAnchor &&
        world.castShape(
          tourFrom,
          { x: 0, y: 0, z: 0, w: 1 },
          dir,
          probe,
          0,
          span,
          true,
          rapier.QueryFilterFlags.EXCLUDE_KINEMATIC,
        )
      if (blocked)
        tourPos.copy(tourFrom).addScaledVector(dir, Math.max(0.6, blocked.time_of_impact - 0.1))
      tourQuat.setFromRotationMatrix(matrix.lookAt(tourPos, tourTarget, camera.up))
    }

    // --- Changements de mode ----------------------------------------------------
    const r = rig.current
    const start = (mode: Mode, duration = TRANSITION) => {
      r.mode = mode
      r.t = 0
      r.duration = duration
      fromPos.copy(camera.position)
      fromQuat.copy(camera.quaternion)
    }
    const touring = r.mode === 'tour' || r.mode === 'toTour'
    if (shotKey && (!touring || shotKey !== r.shot)) {
      start('toTour', TOUR_FLIGHT)
      r.shot = shotKey
      r.hold = 0
    } else if (!shotKey && touring) {
      start('toFollow', TOUR_FLIGHT)
      r.shot = ''
    } else if (anchor && (r.mode === 'follow' || r.mode === 'toFollow')) start('toScreen')
    else if (!anchor && (r.mode === 'screen' || r.mode === 'toScreen')) start('toFollow')

    // --- Application ------------------------------------------------------------
    if (r.mode === 'follow') {
      if (!c.initialized || reducedMotion) camera.position.copy(target)
      else camera.position.lerp(target, 1 - Math.exp(-14 * dt))
      camera.lookAt(look.set(head.x + rightX * shoulder, head.y, head.z + rightZ * shoulder))
    } else if (r.mode === 'screen') {
      camera.position.copy(screenPos)
      camera.quaternion.copy(screenQuat)
    } else if (r.mode === 'tour') {
      // Le plan reste vivant : la caméra avance doucement vers le poste.
      if (!reducedMotion) r.hold = Math.min(r.hold + dt, 6)
      dir.subVectors(tourTarget, tourPos).normalize()
      camera.position.copy(tourPos).addScaledVector(dir, r.hold * TOUR_DRIFT)
      camera.quaternion.copy(tourQuat)
    } else {
      r.t = reducedMotion ? 1 : Math.min(1, r.t + dt / r.duration)
      const e = easeInOutCubic(r.t)
      const [toPos, toQuat, next] =
        r.mode === 'toScreen'
          ? ([screenPos, screenQuat, 'screen'] as const)
          : r.mode === 'toTour'
            ? ([tourPos, tourQuat, 'tour'] as const)
            : ([target, followQuat, 'follow'] as const)
      camera.position.lerpVectors(fromPos, toPos, e)
      camera.quaternion.slerpQuaternions(fromQuat, toQuat, e)
      if (r.t >= 1) r.mode = next
    }
    c.initialized = true
    runtime.cameraPosition.copy(camera.position)
    runtime.cameraMode = r.mode
  })

  return null
}
