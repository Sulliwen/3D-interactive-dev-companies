import { useId } from 'react'
import type { PaintingKind, PaintingLogo, PaintingMood } from './schema'

/** Couleurs des deux ambiances du niveau : la brume froide, le phare rallumé. */
const MOODS = {
  cold: {
    skyTop: '#2b3a4a',
    skyBottom: '#8fa3ad',
    sea: '#2f4552',
    land: '#1c262e',
    fog: '#c9d4d6',
    glow: '#e9f1f2',
  },
  warm: {
    skyTop: '#2a2f45',
    skyBottom: '#e3a35f',
    sea: '#3a4a5a',
    land: '#211d22',
    fog: '#e6c7a2',
    glow: '#ffd27a',
  },
} as const

/**
 * Peinture numérique simplifiée (SVG) : ciel, mer, silhouettes, brume en couches floues.
 * Viewbox 160 × 100 ; le cadre s'adapte à la taille demandée.
 */
export function Painting({
  kind,
  mood,
  variant = 0,
  logo = 'none',
  width,
  height,
}: {
  kind: PaintingKind
  mood: PaintingMood
  variant?: number
  /** Logo du jeu posé sur l'image (illustrations de la boutique). */
  logo?: PaintingLogo
  width: number
  height: number
}) {
  const uid = useId().replace(/:/g, '')
  const c = MOODS[mood]
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 160 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.skyTop} />
          <stop offset="1" stopColor={c.skyBottom} />
        </linearGradient>
        <radialGradient id={`glow-${uid}`}>
          <stop offset="0" stopColor={c.glow} stopOpacity="0.95" />
          <stop offset="1" stopColor={c.glow} stopOpacity="0" />
        </radialGradient>
        <filter id={`blur-${uid}`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect width="160" height="100" fill={`url(#sky-${uid})`} />
      <rect y="62" width="160" height="38" fill={c.sea} />
      {kind === 'lighthouse' && (
        <Lighthouse c={c} uid={uid} variant={variant} lit={mood === 'warm'} />
      )}
      {kind === 'cliff' && <Cliff c={c} uid={uid} />}
      {kind === 'village' && <Village c={c} uid={uid} />}
      {kind === 'maelle' && <Maelle c={c} uid={uid} />}
      {kind === 'keyart' && <KeyArt c={c} uid={uid} simple={variant === 1} />}
      {/* Brume : bandes floues devant le décor. */}
      <g filter={`url(#blur-${uid})`} opacity={mood === 'cold' ? 0.75 : 0.45}>
        <ellipse cx="30" cy="74" rx="46" ry="7" fill={c.fog} />
        <ellipse cx="118" cy="80" rx="54" ry="8" fill={c.fog} />
        <ellipse cx="70" cy="90" rx="70" ry="7" fill={c.fog} />
      </g>
      {logo !== 'none' && <Logo large={logo === 'large'} />}
    </svg>
  )
}

type Palette = (typeof MOODS)[keyof typeof MOODS]

/** Trois pistes de phare : élancé, trapu, en ruine. */
function Lighthouse({
  c,
  uid,
  variant,
  lit,
}: {
  c: Palette
  uid: string
  variant: number
  lit: boolean
}) {
  const top = [18, 30, 26][variant] ?? 18
  const half = [6, 10, 7][variant] ?? 6
  const x = 104
  return (
    <g>
      <path d="M60 100 L78 66 L132 60 L160 70 L160 100 Z" fill={c.land} />
      <path
        d={`M${x - half - 3} 64 L${x - half + 2} ${top} L${x + half - 2} ${top} L${x + half + 3} 64 Z`}
        fill="#d8d2c4"
      />
      {/* Bandes peintes de la tour. */}
      {[0.3, 0.6].map((t) => {
        const y = top + (64 - top) * t
        return (
          <rect
            key={t}
            x={x - half - 1}
            y={y}
            width={half * 2 + 2}
            height="5"
            fill="#9a3b32"
            opacity="0.85"
          />
        )
      })}
      {variant === 2 ? (
        <path
          d={`M${x - half} ${top} L${x - 2} ${top - 5} L${x + 3} ${top - 1} L${x + half} ${top}`}
          fill="none"
          stroke="#3a3330"
          strokeWidth="1.5"
        />
      ) : (
        <>
          <rect x={x - half + 1} y={top - 8} width={half * 2 - 2} height="8" fill="#2a2a30" />
          <path
            d={`M${x - half} ${top - 8} L${x} ${top - 14} L${x + half} ${top - 8} Z`}
            fill="#2a2a30"
          />
          {lit && <circle cx={x} cy={top - 4} r="22" fill={`url(#glow-${uid})`} />}
          <rect
            x={x - half + 3}
            y={top - 6}
            width={half * 2 - 6}
            height="4"
            fill={lit ? c.glow : '#56636b'}
          />
        </>
      )}
    </g>
  )
}

function Cliff({ c, uid }: { c: Palette; uid: string }) {
  return (
    <g>
      <path d="M0 100 L0 40 L30 36 L52 48 L70 46 L84 62 L84 100 Z" fill={c.land} />
      <path d="M84 100 L84 66 L160 64 L160 100 Z" fill={c.sea} />
      {/* Le sentier étroit qui longe la falaise. */}
      <path
        d="M8 44 C 30 40, 48 50, 66 50 S 80 58, 84 62"
        fill="none"
        stroke="#7d7466"
        strokeWidth="1.4"
        strokeDasharray="3 2"
      />
      <path d="M128 64 L131 40 L135 40 L138 64 Z" fill="#cfc9bb" opacity="0.35" />
      <circle cx="133" cy="38" r="10" fill={`url(#glow-${uid})`} opacity="0.35" />
    </g>
  )
}

function Village({ c, uid }: { c: Palette; uid: string }) {
  const houses = [
    [12, 58, 18, 14],
    [34, 54, 22, 18],
    [62, 60, 16, 12],
    [84, 52, 24, 20],
    [114, 58, 18, 14],
    [136, 55, 20, 17],
  ] as const
  return (
    <g>
      <rect y="66" width="160" height="34" fill={c.land} />
      {houses.map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill="#3a4148" />
          <path d={`M${x - 2} ${y} L${x + w / 2} ${y - 8} L${x + w + 2} ${y} Z`} fill="#272c32" />
          {i % 2 === 0 && (
            <rect x={x + w / 2 - 2} y={y + 4} width="4" height="4" fill={c.glow} opacity="0.7" />
          )}
        </g>
      ))}
      <circle cx="96" cy="60" r="16" fill={`url(#glow-${uid})`} opacity="0.4" />
    </g>
  )
}

/** Maëlle de dos, lanterne levée : la lumière creuse un trou dans la brume. */
function Maelle({ c, uid }: { c: Palette; uid: string }) {
  return (
    <g>
      <path d="M0 100 L0 74 L160 70 L160 100 Z" fill={c.land} />
      <circle cx="96" cy="44" r="34" fill={`url(#glow-${uid})`} opacity="0.75" />
      <g fill="#15171c">
        <circle cx="78" cy="44" r="4.5" />
        <path d="M72 50 L84 50 L88 78 L68 78 Z" />
        <path d="M84 52 L96 40 L98 42 L87 56 Z" />
        <rect x="72" y="78" width="4" height="12" />
        <rect x="80" y="78" width="4" height="12" />
        {/* Sacoche de cartographe. */}
        <rect x="66" y="58" width="6" height="9" rx="1" />
      </g>
      <circle cx="98" cy="40" r="3" fill={c.glow} />
    </g>
  )
}

/**
 * L'illustration principale du jeu (« key art ») : Maëlle de dos, lanterne levée, face au
 * phare rallumé de l'autre côté de la baie. `simple` retire les détails (petits formats).
 */
function KeyArt({ c, uid, simple }: { c: Palette; uid: string; simple: boolean }) {
  return (
    <g>
      {/* Le phare, au loin, sur son rocher. */}
      <path d="M92 66 L104 58 L124 57 L134 66 Z" fill={c.land} opacity="0.9" />
      <path d="M109 58 L111.5 30 L116.5 30 L119 58 Z" fill="#d8d2c4" />
      <rect x="110" y="40" width="8" height="3" fill="#9a3b32" opacity="0.85" />
      <rect x="109.6" y="49" width="9" height="3" fill="#9a3b32" opacity="0.85" />
      <rect x="110.5" y="24" width="7" height="6" fill="#2a2a30" />
      <path d="M110 24 L114 19 L118 24 Z" fill="#2a2a30" />
      <circle cx="114" cy="27" r="26" fill={`url(#glow-${uid})`} />
      {!simple && <path d="M114 27 L160 14 L160 34 Z" fill={c.glow} opacity="0.18" />}
      {/* Premier plan : la lande, Maëlle et sa lanterne. */}
      <path d="M0 100 L0 72 C 30 66, 60 70, 92 82 L92 100 Z" fill="#14161b" />
      <circle cx="65" cy="49" r={simple ? 16 : 22} fill={`url(#glow-${uid})`} opacity="0.8" />
      <g fill="#0e1014">
        {/* Maëlle de dos : capuche, cape, bras levé tenant la lanterne. */}
        <circle cx="54" cy="57.5" r="3.1" />
        <path d="M50.6 60.5 Q54 58.6 57.4 60.5 L61 84 L47 84 Z" />
        <path d="M56.6 61.6 L63.4 52.4 L65 53.6 L58.8 63.4 Z" />
        {!simple && <rect x="46.4" y="67" width="3.6" height="5.5" rx="0.8" />}
      </g>
      <path d="M64.4 52.8 L64.4 49.6" stroke="#0e1014" strokeWidth="0.8" />
      <rect x="62.8" y="45.8" width="3.4" height="4.2" rx="0.9" fill={c.glow} />
    </g>
  )
}

/** Logo « BRUME » en capitales espacées, en haut au centre. */
function Logo({ large }: { large: boolean }) {
  return (
    <text
      x="80"
      y={large ? 50 : 17}
      textAnchor="middle"
      fill="#f1e6d0"
      fontSize={large ? 20 : 12}
      fontWeight="700"
      letterSpacing={large ? 5 : 4}
      fontFamily="Georgia, 'Times New Roman', serif"
      stroke="#1b1f2a"
      strokeWidth="0.4"
    >
      BRUME
    </text>
  )
}
