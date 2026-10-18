/**
 * Exporte le plan de l'étage (src/engine/world/floorplan.ts) en JSON pour Blender :
 * art/build/floorplan.json. Le jeu et la scène Blender partent ainsi des mêmes cotes.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createServer } from 'vite'

const root = resolve(import.meta.dirname, '..')
const server = await createServer({
  root,
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false },
})
try {
  const { floorPlan } = await server.ssrLoadModule('/src/engine/world/floorplan.ts')
  const { standPoint } = await server.ssrLoadModule('/src/engine/stations/standPoint.ts')
  const stations = floorPlan.stations.map((s) => ({ ...s, standPoint: standPoint(s) }))
  const out = join(root, 'art/build/floorplan.json')
  mkdirSync(join(root, 'art/build'), { recursive: true })
  writeFileSync(out, JSON.stringify({ ...floorPlan, stations }, null, 1))
  console.log(
    `✓ ${floorPlan.boxes.length} éléments, ${stations.length} postes → art/build/floorplan.json`,
  )
} finally {
  await server.close()
}
