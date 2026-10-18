import { useEffect, useMemo } from 'react'
import { useLoader, useThree } from '@react-three/fiber'
import { suspend } from 'suspend-react'
import { Audio, AudioListener, AudioLoader, PositionalAudio, type Object3D } from 'three'
import { floorPlan } from '../world/floorplan'
import { stationNpcs } from '../world/npcs'
import { useGameStore } from '../../state/useGameStore'

const BASE = `${import.meta.env.BASE_URL}audio/`
const FILES = {
  room: 'ambience_room.mp3',
  chatter: 'ambience_chatter.mp3',
  keyboard: 'keyboard.mp3',
  coffee: 'coffee.mp3',
} as const

/** Les sons ont-ils été préparés (`npm run audio:build`) ? */
function useAudioAvailable(): boolean {
  return suspend(async () => {
    try {
      const res = await fetch(BASE + FILES.room, { method: 'HEAD' })
      return res.ok && !res.headers.get('content-type')?.includes('text/html')
    } catch {
      return false
    }
  }, ['audio-available'])
}

export function Ambience() {
  return useAudioAvailable() ? <AmbienceSources /> : null
}

/**
 * Ambiance sonore : fond d'open space et murmures (partout), claviers près des postes où
 * l'on tape (spatialisés : on les entend en s'approchant), machine à café de temps en temps.
 * Le son démarre au premier geste du visiteur (règle des navigateurs).
 */
function AmbienceSources() {
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  const buffers = useLoader(
    AudioLoader,
    Object.values(FILES).map((f) => BASE + f),
  )
  const [room, chatter, keyboard, coffee] = buffers as [
    AudioBuffer,
    AudioBuffer,
    AudioBuffer,
    AudioBuffer,
  ]
  const volume = useGameStore((s) => s.settings.volume)
  const muted = useGameStore((s) => s.settings.muted)
  const listener = useMemo(() => new AudioListener(), [])

  useEffect(() => {
    camera.add(listener)
    const created: Array<Audio | PositionalAudio> = []
    const anchors: Object3D[] = []

    const loop = (buffer: AudioBuffer, gain: number) => {
      const a = new Audio(listener)
      a.setBuffer(buffer)
      a.setLoop(true)
      a.setVolume(gain)
      created.push(a)
      return a
    }
    loop(room, 0.35)
    loop(chatter, 0.18)

    const at = (
      x: number,
      y: number,
      z: number,
      buffer: AudioBuffer,
      gain: number,
      loopIt: boolean,
    ) => {
      const a = new PositionalAudio(listener)
      a.setBuffer(buffer)
      a.setLoop(loopIt)
      a.setVolume(gain)
      a.setRefDistance(1.2)
      a.setRolloffFactor(2.2)
      a.setMaxDistance(12)
      a.position.set(x, y, z)
      scene.add(a)
      anchors.push(a)
      created.push(a)
      return a
    }
    // Un clavier par personne qui tape, décalé dans le fichier pour éviter l'écho.
    const typists = stationNpcs.filter((n) => n.clip === 'type' || n.clip === 'stand_type')
    typists.forEach((n) => at(n.position[0], 0.8, n.position[1], keyboard, 0.5, true))
    const machine = floorPlan.boxes.find((b) => b.name === 'coffee_machine')
    const coffeeSound = machine
      ? at(machine.position[0], 1.1, machine.position[2], coffee, 0.9, false)
      : null

    let started = false
    let timer = 0
    const start = () => {
      if (started) return
      started = true
      void listener.context.resume()
      created
        .filter((a) => a.getLoop())
        .forEach((a, i) => {
          const offset = (i * 7.3) % Math.max(1, (a.buffer?.duration ?? 1) - 1)
          a.offset = offset
          a.play()
        })
      // La machine à café, toutes les 40 à 80 s.
      const brew = () => {
        coffeeSound?.play()
        timer = window.setTimeout(brew, 40000 + Math.random() * 40000)
      }
      timer = window.setTimeout(brew, 15000)
    }
    window.addEventListener('pointerdown', start)
    window.addEventListener('keydown', start)

    return () => {
      window.removeEventListener('pointerdown', start)
      window.removeEventListener('keydown', start)
      window.clearTimeout(timer)
      created.forEach((a) => a.isPlaying && a.stop())
      anchors.forEach((a) => scene.remove(a))
      camera.remove(listener)
    }
  }, [camera, scene, listener, room, chatter, keyboard, coffee])

  useEffect(() => {
    listener.setMasterVolume(muted ? 0 : volume)
  }, [listener, volume, muted])

  return null
}
