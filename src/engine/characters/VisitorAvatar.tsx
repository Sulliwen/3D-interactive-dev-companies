import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AnimationMixer, type AnimationAction } from 'three'
import { runtime } from '../runtime'
import { usePreparedCharacter, useClips } from './assets'

const FADE = 0.25

/**
 * L'avatar du visiteur (badge « VISITEUR ») : repos, marche ou course selon la vitesse,
 * avec un fondu entre les animations.
 */
export function VisitorAvatar({ id, offsetY }: { id: string; offsetY: number }) {
  const character = usePreparedCharacter(id)
  const clips = useClips()

  const rig = useMemo(() => {
    const mixer = new AnimationMixer(character.model)
    const actions: Record<'idle' | 'walk' | 'run', AnimationAction | null> = {
      idle: clips.idle ? mixer.clipAction(clips.idle) : null,
      walk: clips.walk ? mixer.clipAction(clips.walk) : null,
      run: clips.run ? mixer.clipAction(clips.run) : null,
    }
    return { mixer, actions, current: null as AnimationAction | null }
  }, [character, clips])

  useEffect(() => {
    if (character.lod1) character.lod1.visible = false
    const first = rig.actions.idle
    first?.play()
    rig.current = first
    return () => {
      rig.mixer.stopAllAction()
    }
  }, [rig, character])

  useFrame((_, delta) => {
    const speed = runtime.playerSpeed
    const next = speed < 0.15 ? rig.actions.idle : speed < 2.3 ? rig.actions.walk : rig.actions.run
    if (next && next !== rig.current) {
      next.reset().play()
      if (rig.current) next.crossFadeFrom(rig.current, FADE, false)
      rig.current = next
    }
    // Les pas suivent la vitesse réelle (pas de glissade).
    if (rig.actions.walk) rig.actions.walk.timeScale = Math.min(1.5, Math.max(0.6, speed / 1.4))
    if (rig.actions.run) rig.actions.run.timeScale = Math.min(1.4, Math.max(0.8, speed / 3.2))
    rig.mixer.update(delta)
  })

  return <primitive object={character.model} position-y={offsetY} />
}
