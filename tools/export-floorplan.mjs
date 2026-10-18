/**
 * Exporte le plan d'un étage (src/engine/world/worlds/<monde>/plan.ts) en JSON pour
 * Blender : art/build/<monde>/floorplan.json. Le jeu et la scène Blender partent ainsi des
 * mêmes cotes.
 *
 *   node tools/export-floorplan.mjs [monde]     (par défaut : atelier-lumen)
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createServer } from 'vite'

const root = resolve(import.meta.dirname, '..')
const world = process.argv[2] ?? 'atelier-lumen'
const server = await createServer({
  root,
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false },
})
try {
  const { WORLDS } = await server.ssrLoadModule('/src/engine/world/worlds/index.ts')
  const floorPlan = WORLDS[world]?.plan
  if (!floorPlan) throw new Error(`Monde inconnu : ${world} (${Object.keys(WORLDS).join(', ')})`)
  const { standPoint } = await server.ssrLoadModule('/src/engine/stations/standPoint.ts')
  const stations = floorPlan.stations.map((s) => ({ ...s, standPoint: standPoint(s) }))
  const dir = join(root, 'art/build', world)
  const out = join(dir, 'floorplan.json')
  mkdirSync(dir, { recursive: true })
  writeFileSync(out, JSON.stringify({ ...floorPlan, stations }, null, 1))
  console.log(
    `✓ ${floorPlan.boxes.length} éléments, ${stations.length} postes → art/build/${world}/floorplan.json`,
  )
} finally {
  await server.close()
}
