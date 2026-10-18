/** Petites icônes des outils simulés, en SVG (les glyphes Unicode manquent sur certains systèmes). */

const PATHS = {
  files: 'M4 2h6l4 4v8H4z M10 2v4h4',
  search: 'M7 3a4 4 0 1 1 0 8a4 4 0 0 1 0-8z M10 10l4 4',
  branch: 'M5 2v12 M5 9c0-3 6-2 6-5 M11 2v2 M5 14a1.5 1.5 0 1 0 0-.01 M11 4a1.5 1.5 0 1 0 0-.01',
  play: 'M5 3l8 5l-8 5z',
  check: 'M3 8l3 3l7-7',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ verticalAlign: '-0.15em' }}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
