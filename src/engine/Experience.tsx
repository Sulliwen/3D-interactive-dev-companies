import { lazy, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Sky } from '@react-three/drei'
import { Bloom, EffectComposer, SMAA, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { AgXToneMapping, NoToneMapping } from 'three'
import { Blockout } from './world/Blockout'
import { OfficeModel } from './world/OfficeModel'
import { useOfficeMeta } from './world/officeMeta'
import { SkyEnvironment } from './world/SkyEnvironment'
import { Colliders } from './world/Colliders'
import { CityBackdrop } from './world/CityBackdrop'
import { MoveMarker } from './world/MoveMarker'
import { GuideLine } from './world/GuideLine'
import { EmptyDesks, ScenarioBoards } from './world/ScenarioBoards'
import { StationScreens } from './stations/StationScreens'
import { Player } from './player/Player'
import { CameraRig } from './camera/CameraRig'
import { Characters } from './characters/Characters'
import { Ambience } from './audio/Ambience'
import { useCharactersAvailable } from './characters/assets'
import { ClickFloor } from './world/ClickFloor'
import { QUALITY } from './quality'
import { useGameStore } from '../state/useGameStore'

// Outil de mesure des performances, exclu du build de production.
const Perf = import.meta.env.DEV
  ? lazy(() => import('r3f-perf').then((m) => ({ default: m.Perf })))
  : null

const SUN_POSITION = [24, 30, -14] as const

export function Experience() {
  const quality = useGameStore((s) => s.settings.quality)
  const debugPhysics = useGameStore((s) => s.debugPhysics)
  const showPerf = useGameStore((s) => s.showPerf)
  const profile = QUALITY[quality]

  return (
    <Canvas
      // Recréer le contexte au changement de qualité (certains réglages sont fixés à la création).
      key={quality}
      shadows={profile.shadows ? 'percentage' : false}
      dpr={profile.dpr}
      gl={{
        // En qualité élevée, antialiasing et rendu des couleurs passent par le
        // post-traitement (SMAA, AgX) ; en qualité basse, par le moteur de rendu seul.
        antialias: false,
        powerPreference: 'high-performance',
        toneMapping: profile.postprocessing ? NoToneMapping : AgXToneMapping,
      }}
      camera={{ fov: 55, near: 0.05, far: 400, position: [0, 3, 13] }}
      aria-label="Vue 3D de l'étage d'Atelier Lumen"
    >
      <Suspense fallback={null}>
        <Physics timeStep="vary" debug={debugPhysics}>
          <Colliders />
          <Player />
          <CameraRig />
        </Physics>
        <World shadows={profile.shadows} shadowMapSize={profile.shadowMapSize} />
        <StationScreens />
        <ScenarioBoards />
        <EmptyDesks />
        <MoveMarker />
        <GuideLine />
        <CityBackdrop />
      </Suspense>

      {profile.postprocessing && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.25} luminanceThreshold={0.92} mipmapBlur />
          <ToneMapping mode={ToneMappingMode.AGX} />
          <SMAA />
        </EffectComposer>
      )}

      {Perf && showPerf && (
        <Suspense fallback={null}>
          <Perf position="top-left" />
        </Suspense>
      )}
    </Canvas>
  )
}

/**
 * L'étage : le modèle Blender avec son éclairage précalculé s'il a été produit
 * (`npm run art:build`), sinon le blockout en boîtes éclairé en temps réel.
 */
function World({ shadows, shadowMapSize }: { shadows: boolean; shadowMapSize: number }) {
  const meta = useOfficeMeta()
  const forceBlockout = useGameStore((s) => s.forceBlockout)

  if (meta && !forceBlockout) {
    return (
      <>
        <fog attach="fog" args={['#dfe7ee', 70, 260]} />
        <SkyEnvironment intensity={0.9} />
        {/* Pas de lumière en temps réel : elle s'ajouterait à l'éclairage précalculé et
            l'écraserait. Les objets mobiles (avatar) sont éclairés par le ciel. */}
        <OfficeModel meta={meta} />
        <ClickFloor />
        <OptionalCharacters />
        <Ambience />
      </>
    )
  }

  return (
    <>
      <color attach="background" args={['#cfdde8']} />
      <fog attach="fog" args={['#cfdde8', 60, 220]} />
      <Sky sunPosition={SUN_POSITION} turbidity={6} rayleigh={1.2} />

      <hemisphereLight args={['#e8f0ff', '#b8a78f', 1.1]} />
      <directionalLight
        position={SUN_POSITION}
        intensity={2.2}
        castShadow={shadows}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={1}
        shadow-camera-far={90}
      />
      <Blockout shadows={shadows} />
    </>
  )
}

/** Les personnages, s'ils ont été produits (`npm run art:characters`). */
function OptionalCharacters() {
  return useCharactersAvailable() ? <Characters /> : null
}
