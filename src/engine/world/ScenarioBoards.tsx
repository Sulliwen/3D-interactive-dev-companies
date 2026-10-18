import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { useVisit } from '../../state/visit'
import { floorPlan } from './floorplan'
import { stagingFor, type BoardProp } from './staging'

/** Résolution des panneaux : pixels par mètre. */
const PX_PER_M = 420
const POSTIT = ['#f7d154', '#7fc8f8', '#f4978e', '#a8e6a3']

/** Les panneaux propres au scénario en cours (tableaux d'atelier, plans de version…). */
export function ScenarioBoards() {
  const boards = stagingFor(useVisit().key).boards ?? []
  return (
    <>
      {boards.map((b) => (
        <Board key={b.id} board={b} />
      ))}
    </>
  )
}

function Board({ board }: { board: BoardProp }) {
  const texture = useMemo(() => drawBoard(board), [board])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <mesh position={board.position} rotation-y={board.rotationY}>
      <planeGeometry args={board.size} />
      {/* Teinte légèrement grisée : sans éclairage, un blanc pur paraîtrait lumineux. */}
      <meshBasicMaterial map={texture} color="#d9dce0" />
    </mesh>
  )
}

function drawBoard(b: BoardProp): CanvasTexture {
  const [w, h] = [Math.round(b.size[0] * PX_PER_M), Math.round(b.size[1] * PX_PER_M)]
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const pad = w * 0.04
    ctx.fillStyle = b.background
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#17202b'
    ctx.textBaseline = 'top'
    const titleSize = Math.min(h * 0.09, w * 0.07)
    ctx.font = `800 ${titleSize}px system-ui, sans-serif`
    ctx.fillText(b.title, pad, pad, w - 2 * pad)
    let y = pad + titleSize * 1.25
    if (b.subtitle) {
      ctx.font = `500 ${titleSize * 0.55}px system-ui, sans-serif`
      ctx.fillStyle = '#3f4c5a'
      ctx.fillText(b.subtitle, pad, y, w - 2 * pad)
      y += titleSize * 0.9
    }
    if (b.columns) drawColumns(ctx, b.columns, pad, y, w - pad, h - pad, titleSize)
    if (b.lines) {
      ctx.fillStyle = '#17202b'
      ctx.font = `600 ${titleSize * 0.7}px system-ui, sans-serif`
      for (const line of b.lines) {
        y += titleSize * 0.95
        ctx.fillText(line, pad, y, w - 2 * pad)
      }
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function drawColumns(
  ctx: CanvasRenderingContext2D,
  columns: NonNullable<BoardProp['columns']>,
  left: number,
  top: number,
  right: number,
  bottom: number,
  titleSize: number,
) {
  const gap = titleSize * 0.4
  const colW = (right - left - gap * (columns.length - 1)) / columns.length
  const headSize = titleSize * 0.5
  const cardFont = titleSize * 0.5
  columns.forEach((col, i) => {
    const x = left + i * (colW + gap)
    ctx.fillStyle = '#17202b'
    ctx.font = `800 ${headSize}px system-ui, sans-serif`
    ctx.fillText(col.title, x, top, colW)
    let y = top + headSize * 1.5
    col.cards.forEach((card, k) => {
      const lines = wrap(ctx, card, colW - cardFont, `600 ${cardFont}px system-ui, sans-serif`)
      const cardH = cardFont * (lines.length * 1.2 + 0.9)
      if (y + cardH > bottom) return
      ctx.fillStyle = POSTIT[(i + k) % POSTIT.length]!
      ctx.fillRect(x, y, colW, cardH)
      ctx.fillStyle = '#1a1206'
      lines.forEach((line, l) =>
        ctx.fillText(line, x + cardFont * 0.5, y + cardFont * (0.45 + l * 1.2)),
      )
      y += cardH + gap * 0.6
    })
  })
}

/** Coupe un texte en lignes qui tiennent dans `width`. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, font: string): string[] {
  ctx.font = font
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > width && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

/** Cartons empilés à côté de la chaise : bureau prêt pour une arrivée future. */
const CARTONS: Array<{ size: [number, number, number]; offset: [number, number]; turn: number }> = [
  { size: [0.5, 0.34, 0.38], offset: [0.75, 0.6], turn: 0.1 },
  { size: [0.4, 0.28, 0.32], offset: [0.78, 0.58], turn: -0.25 },
]

/** Les bureaux des personnes pas encore arrivées (scénario des débuts) : quelques cartons. */
export function EmptyDesks() {
  const visit = useVisit()
  const desks = visit.stations.filter((s) => s.absent).map((s) => s.desk)
  return (
    <>
      {floorPlan.stations
        .filter((a) => desks.includes(a.number))
        .map((a) => {
          const r = a.screenRotationY
          const [cx, , cz] = a.screenPosition
          let y = 0
          return CARTONS.map((c, i) => {
            const [forward, right] = c.offset
            const position: [number, number, number] = [
              cx + Math.sin(r) * forward + Math.cos(r) * right,
              y + c.size[1] / 2,
              cz + Math.cos(r) * forward - Math.sin(r) * right,
            ]
            y += c.size[1]
            return (
              <mesh key={`${a.number}-${i}`} position={position} rotation-y={r + c.turn}>
                <boxGeometry args={c.size} />
                <meshStandardMaterial color="#b98a5a" roughness={0.9} />
              </mesh>
            )
          })
        })}
    </>
  )
}
