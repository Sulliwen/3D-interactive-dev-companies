import type { BoxElement, FloorPlan, Vec2 } from '../world/floorplan'

/**
 * Grille de navigation de l'étage : chaque case de 25 cm est libre ou bloquée
 * (obstacle élargi du rayon du visiteur). Sert au clic au sol, au parcours guidé
 * et à la mini-carte. Calculée une fois, à partir des mêmes données que les collisions.
 */
export interface NavGrid {
  cell: number
  cols: number
  rows: number
  minX: number
  minZ: number
  blocked: Uint8Array
}

export function buildNavGrid(
  plan: Pick<FloorPlan, 'width' | 'depth' | 'boxes'>,
  cell = 0.25,
  agentRadius = 0.35,
): NavGrid {
  const cols = Math.round(plan.width / cell)
  const rows = Math.round(plan.depth / cell)
  const minX = -plan.width / 2
  const minZ = -plan.depth / 2
  const blocked = new Uint8Array(cols * rows)
  // Seuls les obstacles à hauteur de jambes comptent (pas un écran mural, pas un linteau).
  const obstacles = plan.boxes.filter((b) => b.collider && b.position[1] - b.size[1] / 2 < 1)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = minX + (c + 0.5) * cell
      const z = minZ + (r + 0.5) * cell
      const outside =
        x < minX + agentRadius ||
        x > -minX - agentRadius ||
        z < minZ + agentRadius ||
        z > -minZ - agentRadius
      if (outside || obstacles.some((b) => insideInflated(b, x, z, agentRadius))) {
        blocked[r * cols + c] = 1
      }
    }
  }
  return { cell, cols, rows, minX, minZ, blocked }
}

function insideInflated(box: BoxElement, x: number, z: number, radius: number): boolean {
  // Ramener le point dans le repère de la boîte (rotation inverse autour de Y).
  const a = -(box.rotationY ?? 0)
  const dx = x - box.position[0]
  const dz = z - box.position[2]
  const lx = dx * Math.cos(a) + dz * Math.sin(a)
  const lz = -dx * Math.sin(a) + dz * Math.cos(a)
  // Distance à un rectangle : proche des coins, on arrondit (comme une capsule).
  const qx = Math.max(Math.abs(lx) - box.size[0] / 2, 0)
  const qz = Math.max(Math.abs(lz) - box.size[2] / 2, 0)
  return qx * qx + qz * qz < radius * radius
}

export function toCell(grid: NavGrid, [x, z]: Vec2): [number, number] {
  return [
    Math.min(grid.cols - 1, Math.max(0, Math.floor((x - grid.minX) / grid.cell))),
    Math.min(grid.rows - 1, Math.max(0, Math.floor((z - grid.minZ) / grid.cell))),
  ]
}

export function cellCenter(grid: NavGrid, c: number, r: number): Vec2 {
  return [grid.minX + (c + 0.5) * grid.cell, grid.minZ + (r + 0.5) * grid.cell]
}

export function isFree(grid: NavGrid, c: number, r: number): boolean {
  return c >= 0 && r >= 0 && c < grid.cols && r < grid.rows && grid.blocked[r * grid.cols + c] === 0
}

/** Case libre la plus proche (recherche en largeur), ou `null` si aucune. */
export function nearestFree(grid: NavGrid, c0: number, r0: number): [number, number] | null {
  if (isFree(grid, c0, r0)) return [c0, r0]
  const seen = new Uint8Array(grid.cols * grid.rows)
  const queue: Array<[number, number]> = [[c0, r0]]
  seen[r0 * grid.cols + c0] = 1
  for (let i = 0; i < queue.length; i++) {
    const [c, r] = queue[i]!
    for (const [dc, dr] of NEIGHBOURS_4) {
      const nc = c + dc
      const nr = r + dr
      if (nc < 0 || nr < 0 || nc >= grid.cols || nr >= grid.rows) continue
      const k = nr * grid.cols + nc
      if (seen[k]) continue
      if (grid.blocked[k] === 0) return [nc, nr]
      seen[k] = 1
      queue.push([nc, nr])
    }
  }
  return null
}

const NEIGHBOURS_4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const

const NEIGHBOURS_8 = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
] as const

/**
 * Itinéraire entre deux points (A*, 8 directions, sans couper les coins), lissé
 * en ne gardant que les virages nécessaires. Le départ et l'arrivée sont ramenés
 * sur la case libre la plus proche. `null` si aucun chemin.
 */
export function findPath(grid: NavGrid, from: Vec2, to: Vec2): Vec2[] | null {
  const startCell = nearestFree(grid, ...toCell(grid, from))
  const goalCell = nearestFree(grid, ...toCell(grid, to))
  if (!startCell || !goalCell) return null
  const start = startCell[1] * grid.cols + startCell[0]
  const goal = goalCell[1] * grid.cols + goalCell[0]

  const n = grid.cols * grid.rows
  const g = new Float64Array(n).fill(Infinity)
  const parent = new Int32Array(n).fill(-1)
  const closed = new Uint8Array(n)
  const heap = new MinHeap()
  const [gc, gr] = goalCell
  const h = (k: number) => {
    const dc = Math.abs((k % grid.cols) - gc)
    const dr = Math.abs(Math.floor(k / grid.cols) - gr)
    return Math.max(dc, dr) + (Math.SQRT2 - 1) * Math.min(dc, dr)
  }
  g[start] = 0
  heap.push(start, h(start))

  while (heap.size > 0) {
    const k = heap.pop()
    if (k === goal) break
    if (closed[k]) continue
    closed[k] = 1
    const c = k % grid.cols
    const r = Math.floor(k / grid.cols)
    for (const [dc, dr, cost] of NEIGHBOURS_8) {
      const nc = c + dc
      const nr = r + dr
      if (!isFree(grid, nc, nr)) continue
      // Pas de diagonale qui frôle un coin bloqué.
      if (dc !== 0 && dr !== 0 && (!isFree(grid, c + dc, r) || !isFree(grid, c, r + dr))) continue
      const nk = nr * grid.cols + nc
      const ng = g[k]! + cost
      if (ng < g[nk]!) {
        g[nk] = ng
        parent[nk] = k
        heap.push(nk, ng + h(nk))
      }
    }
  }
  if (start !== goal && parent[goal] === -1) return null

  const cells: number[] = []
  for (let k = goal; k !== -1; k = parent[k]!) {
    cells.push(k)
    if (k === start) break
  }
  cells.reverse()
  const points = cells.map((k) => cellCenter(grid, k % grid.cols, Math.floor(k / grid.cols)))
  // Les vrais points de départ et d'arrivée, s'ils sont accessibles.
  if (lineOfSight(grid, from, points[0]!)) points[0] = from
  if (lineOfSight(grid, points[points.length - 1]!, to)) points[points.length - 1] = to
  return smooth(grid, points)
}

/** Retire les points intermédiaires quand on peut aller tout droit. */
function smooth(grid: NavGrid, points: Vec2[]): Vec2[] {
  if (points.length <= 2) return points
  const out: Vec2[] = [points[0]!]
  let anchor = 0
  for (let i = 2; i < points.length; i++) {
    if (!lineOfSight(grid, points[anchor]!, points[i]!)) {
      out.push(points[i - 1]!)
      anchor = i - 1
    }
  }
  out.push(points[points.length - 1]!)
  return out
}

/** Le segment ne traverse-t-il que des cases libres ? (échantillonnage fin) */
export function lineOfSight(grid: NavGrid, a: Vec2, b: Vec2): boolean {
  const dist = Math.hypot(b[0] - a[0], b[1] - a[1])
  const steps = Math.max(1, Math.ceil(dist / (grid.cell * 0.4)))
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const [c, r] = toCell(grid, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
    if (!isFree(grid, c, r)) return false
  }
  return true
}

/** Longueur d'un itinéraire, en mètres. */
export function pathLength(points: readonly Vec2[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i]![0] - points[i - 1]![0], points[i]![1] - points[i - 1]![1])
  }
  return total
}

class MinHeap {
  private keys: number[] = []
  private prio: number[] = []
  get size() {
    return this.keys.length
  }
  push(key: number, priority: number) {
    this.keys.push(key)
    this.prio.push(priority)
    let i = this.keys.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (this.prio[p]! <= this.prio[i]!) break
      this.swap(i, p)
      i = p
    }
  }
  pop(): number {
    const top = this.keys[0]!
    const lastKey = this.keys.pop()!
    const lastPrio = this.prio.pop()!
    if (this.keys.length > 0) {
      this.keys[0] = lastKey
      this.prio[0] = lastPrio
      let i = 0
      for (;;) {
        const l = 2 * i + 1
        const r = l + 1
        let m = i
        if (l < this.keys.length && this.prio[l]! < this.prio[m]!) m = l
        if (r < this.keys.length && this.prio[r]! < this.prio[m]!) m = r
        if (m === i) break
        this.swap(i, m)
        i = m
      }
    }
    return top
  }
  private swap(a: number, b: number) {
    ;[this.keys[a], this.keys[b]] = [this.keys[b]!, this.keys[a]!]
    ;[this.prio[a], this.prio[b]] = [this.prio[b]!, this.prio[a]!]
  }
}
