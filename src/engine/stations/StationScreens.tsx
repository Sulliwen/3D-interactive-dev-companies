import { Suspense, useEffect, useMemo, useState } from 'react'
import { Html, useTexture } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { CanvasTexture, SRGBColorSpace, type Texture } from 'three'
import type { StationAnchor } from '../world/floorplan'
import { useWorld } from '../world/worlds'
import { INTERACTION_RADIUS, findNearbyStation } from './proximity'
import { runtime } from '../runtime'
import { standPoint } from './standPoint'
import { stationAtDesk, type Visit } from '../../content/loader'
import { isExploring, useGameStore } from '../../state/useGameStore'
import { useVisit } from '../../state/visit'
import { SCREEN_HEIGHT, SCREEN_WIDTH, ScreenFrame } from '../../stations/ScreenFrame'

// Captures des écrans (`npm run screens:capture`) :
// <structure>/<scénario>/station-08.jpg → clé « structure/scénario/8 ».
const captures: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('../../assets/screens/*/*/station-*.jpg', {
      eager: true,
      query: '?url',
      import: 'default',
    }),
  ).map(([path, url]) => {
    const [, structure, scenario, desk] = /([^/]+)\/([^/]+)\/station-(\d+)\.jpg$/.exec(path)!
    return [`${structure}/${scenario}/${Number(desk)}`, url]
  }),
)

/** Image fixe de l'écran d'un poste, pour la visite en cours. */
function captureFor(visit: Visit, desk: number): string | undefined {
  const station = stationAtDesk(visit, desk)
  if (!station?.screenScenario) return undefined
  return captures[`${visit.structure.id}/${station.screenScenario}/${desk}`]
}

/**
 * Écrans des postes. De loin : une image fixe et légère. Pendant le zoom : la
 * véritable interface React, projetée sur le moniteur.
 */
export function StationScreens() {
  const floorPlan = useWorld().plan
  const nearby = useGameStore((s) => s.nearbyStation)
  const active = useGameStore((s) => s.activeStation)
  const visit = useVisit()
  return (
    <group>
      {floorPlan.stations.map((anchor) => (
        <group key={anchor.number}>
          <Suspense fallback={<StaticScreen anchor={anchor} highlighted={false} />}>
            <StaticScreen
              anchor={anchor}
              url={captureFor(visit, anchor.number)}
              off={stationAtDesk(visit, anchor.number)?.absent}
              highlighted={nearby === anchor.number}
            />
          </Suspense>
          {active === anchor.number && <LiveScreen anchor={anchor} visit={visit} />}
        </group>
      ))}
    </group>
  )
}

function StaticScreen({
  anchor,
  url,
  off = false,
  highlighted,
}: {
  anchor: StationAnchor
  url?: string
  /** Bureau vide : écran éteint. */
  off?: boolean
  highlighted: boolean
}) {
  const onClick = useScreenClick(anchor)
  const [hovered, setHovered] = useState(false)
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : ''
  }, [hovered])

  return (
    <mesh
      position={anchor.screenPosition}
      rotation-y={anchor.screenRotationY}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <planeGeometry args={anchor.screenSize} />
      {off ? (
        <meshBasicMaterial color={highlighted || hovered ? '#2a3442' : '#0e1218'} />
      ) : url ? (
        <CapturedMaterial url={url} highlighted={highlighted || hovered} />
      ) : (
        <NumberMaterial n={anchor.number} highlighted={highlighted || hovered} />
      )}
    </mesh>
  )
}

function CapturedMaterial({ url, highlighted }: { url: string; highlighted: boolean }) {
  const texture = useTexture(url, (t: Texture) => {
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 4
  })
  return (
    <meshBasicMaterial
      map={texture}
      color={highlighted ? '#ffffff' : '#c9ced8'}
      toneMapped={false}
    />
  )
}

function NumberMaterial({ n, highlighted }: { n: number; highlighted: boolean }) {
  const texture = useMemo(() => numberTexture(n), [n])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <meshBasicMaterial
      map={texture}
      color={highlighted ? '#ffffff' : '#8a96a8'}
      toneMapped={false}
    />
  )
}

/** Clic sur un écran : on le regarde si l'on est à portée, sinon on s'en approche. */
function useScreenClick(anchor: StationAnchor) {
  return (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const store = useGameStore.getState()
    if (e.button !== 0 || e.delta > 6 || !isExploring(store)) return
    const p = runtime.playerPosition
    const inRange = findNearbyStation([p.x, p.z], [anchor], INTERACTION_RADIUS + 0.5) !== null
    if (inRange) {
      store.openStation(anchor.number)
    } else if (store.settings.clickToMove) {
      const [x, z] = standPoint(anchor)
      store.setMoveTarget([x, 0, z])
    }
  }
}

/** Interface interactive posée sur le moniteur (1 px CSS = largeur de l'écran / 960). */
function LiveScreen({ anchor, visit }: { anchor: StationAnchor; visit: Visit }) {
  const station = stationAtDesk(visit, anchor.number)
  if (!station) return null
  const [x, y, z] = anchor.screenPosition
  const r = anchor.screenRotationY
  const lift = 0.002 // juste devant l'image fixe
  return (
    <Html
      transform
      position={[x + Math.sin(r) * lift, y, z + Math.cos(r) * lift]}
      rotation-y={r}
      distanceFactor={(400 * anchor.screenSize[0]) / SCREEN_WIDTH}
      zIndexRange={[10, 0]}
      className="live-screen"
      style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
    >
      <ScreenFrame station={station} live />
    </Html>
  )
}

function numberTexture(n: number): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 148
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#25466b'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 84px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(n), canvas.width / 2, canvas.height / 2 + 4)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}
