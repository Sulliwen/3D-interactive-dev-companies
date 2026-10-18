/**
 * Génère l'image fixe de chaque écran simulé (vue de loin dans la 3D) :
 * src/assets/screens/<structure>/<scénario>/station-NN.jpg (NN : numéro du poste). À relancer après avoir modifié un écran.
 *
 *   npm run screens:capture                                (tous les écrans rédigés)
 *   npm run screens:capture -- atelier-lumen/preparer-v2   (un seul scénario)
 *
 * Nécessite Chrome ou Chromium. Chemin personnalisé : CHROME_PATH=/chemin/vers/chrome
 */
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createServer } from 'vite'
import { chromium } from 'playwright-core'

const root = resolve(import.meta.dirname, '..')
const outDir = join(root, 'src/assets/screens')
const structuresDir = join(root, 'src/content/structures')

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean)

const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p))
if (!executablePath) {
  console.error('Chrome introuvable. Indiquez son chemin : CHROME_PATH=/chemin/vers/chrome')
  process.exit(1)
}

// Filtre facultatif : `atelier-lumen/preparer-v2` (un scénario) ou `atelier-lumen` (une structure).
const only = process.argv.slice(2)

/** Chaque écran rédigé : structures/<s>/scenarios/<sc>/steps/*.json → poste (desk) du métier. */
const targets = []
for (const structure of readdirSync(structuresDir, { withFileTypes: true })) {
  if (!structure.isDirectory()) continue
  const base = join(structuresDir, structure.name)
  const desks = new Map(
    readdirSync(join(base, 'roles'))
      .map((f) => JSON.parse(readFileSync(join(base, 'roles', f), 'utf8')))
      .map((r) => [r.id, r.desk]),
  )
  for (const scenario of readdirSync(join(base, 'scenarios'))) {
    const steps = join(base, 'scenarios', scenario, 'steps')
    for (const f of readdirSync(steps).filter((f) => f.endsWith('.json'))) {
      const step = JSON.parse(readFileSync(join(steps, f), 'utf8'))
      targets.push({ structure: structure.name, scenario, desk: desks.get(step.role) })
    }
  }
}
const selected = targets.filter(
  (t) =>
    only.length === 0 ||
    only.some((o) => `${t.structure}/${t.scenario}/`.startsWith(o.replace(/\/?$/, '/'))),
)

mkdirSync(outDir, { recursive: true })
const server = await createServer({ root, logLevel: 'error', server: { port: 0 } })
await server.listen()
const url = server.resolvedUrls.local[0]
const browser = await chromium.launch({ executablePath })

try {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 600 },
    deviceScaleFactor: 1,
  })
  for (const t of selected) {
    await page.goto(`${url}?capture=${t.structure}/${t.scenario}/${t.desk}`)
    const screen = page.locator('#capture')
    await screen.waitFor()
    await page.evaluate(() => document.fonts.ready)
    const dir = join(outDir, t.structure, t.scenario)
    mkdirSync(dir, { recursive: true })
    const file = join(dir, `station-${String(t.desk).padStart(2, '0')}.jpg`)
    await screen.screenshot({ path: file, type: 'jpeg', quality: 85 })
    console.log(`✓ ${t.structure}/${t.scenario}, poste ${t.desk} → ${file.replace(root + '/', '')}`)
  }
} finally {
  await browser.close()
  await server.close()
}
