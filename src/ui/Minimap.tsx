import { useEffect, useMemo, useRef } from 'react'
import { stationAtDesk, stationLabel } from '../content/loader'
import { floorPlan, type StationAnchor } from '../engine/world/floorplan'
import { FLOORS } from '../engine/world/materials'
import { runtime } from '../engine/runtime'
import { standPoint } from '../engine/stations/standPoint'
import { useNextStation } from '../engine/stations/useNextStation'
import { isExploring, useGameStore } from '../state/useGameStore'
import { useProgress, useVisit } from '../state/visit'

const DEG = 180 / Math.PI
const SIZES = { small: 290, large: 470 } as const
const PAD = 0.6

/**
 * Mini-carte du plateau, nord en haut : position et orientation du visiteur,
 * postes vus / prochain / à voir, tracé du parcours guidé. Un clic sur un poste y emmène.
 */
export function Minimap() {
  const size = useGameStore((s) => s.settings.minimap)
  const setSetting = useGameStore((s) => s.setSetting)
  const visit = useVisit()
  const visited = useProgress().visited
  const setMoveTarget = useGameStore((s) => s.setMoveTarget)
  const next = useNextStation()
  // Pendant la présentation, la carte suit le poste survolé.
  const tourDesk = useGameStore((s) =>
    s.tour === null ? null : (visit.pathStations[s.tour]?.desk ?? null),
  )
  const player = useRef<SVGGElement>(null)
  const guide = useRef<SVGPolylineElement>(null)

  // Position du visiteur et tracé : mis à jour à chaque image, sans rendu React.
  useEffect(() => {
    if (size === 'hidden') return
    let frame = 0
    const tick = () => {
      const p = runtime.playerPosition
      player.current?.setAttribute(
        'transform',
        `translate(${p.x.toFixed(2)} ${p.z.toFixed(2)}) rotate(${(-runtime.playerYaw * DEG).toFixed(1)})`,
      )
      const path = runtime.guidePath
      guide.current?.setAttribute('points', path ? path.map(([x, z]) => `${x},${z}`).join(' ') : '')
      frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  }, [size])

  const background = useMemo(() => <MapBackground />, [])

  if (size === 'hidden') {
    return (
      <button
        type="button"
        className="button minimap-show"
        onClick={() => setSetting('minimap', 'small')}
      >
        Afficher la carte
      </button>
    )
  }

  const goTo = (anchor: StationAnchor) => {
    if (!isExploring(useGameStore.getState())) return
    const [x, z] = standPoint(anchor)
    setMoveTarget([x, 0, z])
  }
  const w = floorPlan.width + PAD * 2
  const h = floorPlan.depth + PAD * 2

  return (
    <section className={`minimap minimap--${size}`} aria-label="Plan de l'étage">
      <svg
        width={SIZES[size]}
        height={(SIZES[size] * h) / w}
        viewBox={`${-floorPlan.width / 2 - PAD} ${-floorPlan.depth / 2 - PAD} ${w} ${h}`}
      >
        {background}
        <polyline ref={guide} className="minimap__guide" fill="none" />
        {floorPlan.stations.map((anchor) => {
          const station = stationAtDesk(visit, anchor.number)
          if (!station) return null
          const bystander = station.status === 'bystander'
          const seen = !bystander && visited.includes(station.id)
          const isNext =
            tourDesk === null ? next?.number === anchor.number : tourDesk === anchor.number
          const [x, z] = standPoint(anchor, 0.9)
          const kind =
            station.status === 'bonus'
              ? 'Poste bonus : '
              : station.absent
                ? 'Bureau vide : '
                : bystander
                  ? 'Hors de ce scénario : '
                  : 'Étape '
          const label = `${kind}${stationLabel(station)}${seen ? ', déjà vue' : ''}${isNext ? ', prochaine étape' : ''}. Y aller`
          return (
            <g
              key={anchor.number}
              className={`minimap__station ${seen ? 'is-seen' : ''} ${isNext ? 'is-next' : ''} ${station.status === 'bonus' ? 'is-bonus' : ''} ${bystander ? 'is-bystander' : ''}`}
              transform={`translate(${x} ${z})`}
              role="button"
              tabIndex={0}
              aria-label={label}
              onClick={() => goTo(anchor)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  goTo(anchor)
                }
              }}
            >
              <title>{label}</title>
              {isNext && <circle r={0.95} className="minimap__halo" />}
              <circle r={0.58} />
              <text y={0.2}>
                {seen ? '✓' : station.status === 'bonus' ? '★' : bystander ? '–' : station.step}
              </text>
            </g>
          )
        })}
        <g ref={player} className="minimap__player">
          <path d="M0,0.75 L0.5,-0.45 L0,-0.2 L-0.5,-0.45 Z" />
        </g>
      </svg>
      <div className="minimap__bar">
        <span className="minimap__legend">
          <i className="is-next" /> prochain · <i className="is-seen" /> vu ·{' '}
          <i className="is-bystander" /> hors scénario
        </span>
        <button
          type="button"
          onClick={() => setSetting('minimap', size === 'small' ? 'large' : 'small')}
          aria-label={size === 'small' ? 'Agrandir la carte' : 'Réduire la carte'}
        >
          {size === 'small' ? '⤢' : '⤡'}
        </button>
        <button
          type="button"
          onClick={() => setSetting('minimap', 'hidden')}
          aria-label="Masquer la carte"
        >
          ×
        </button>
      </div>
      <p className="visually-hidden">
        {visit.pathStations.length} étapes ; utilisez Tab pour choisir un poste et Entrée pour y
        aller.
      </p>
    </section>
  )
}

/** Fond de carte : sols par zone, murs et mobilier (statique). */
function MapBackground() {
  return (
    <g>
      <rect
        x={-floorPlan.width / 2}
        y={-floorPlan.depth / 2}
        width={floorPlan.width}
        height={floorPlan.depth}
        fill={FLOORS.concrete}
      />
      {floorPlan.zones.map((zone) => (
        <rect
          key={zone.id}
          x={zone.min[0]}
          y={zone.min[1]}
          width={zone.max[0] - zone.min[0]}
          height={zone.max[1] - zone.min[1]}
          fill={FLOORS[zone.floor]}
          opacity={0.75}
        />
      ))}
      {floorPlan.boxes
        .filter((b) => b.collider || b.material === 'fabric')
        .map((b) => (
          <rect
            key={b.name}
            className={`minimap__box minimap__box--${b.material}`}
            x={-b.size[0] / 2}
            y={-b.size[2] / 2}
            width={b.size[0]}
            height={b.size[2]}
            transform={`translate(${b.position[0]} ${b.position[2]}) rotate(${-(b.rotationY ?? 0) * DEG})`}
          />
        ))}
    </g>
  )
}
