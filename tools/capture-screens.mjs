/**
 * Génère l'image fixe de chaque écran simulé (vue de loin dans la 3D) :
 * src/assets/screens/station-NN.jpg. À relancer après avoir modifié un écran.
 *
 *   npm run screens:capture          (tous les postes rédigés)
 *   npm run screens:capture -- 1 14  (seulement les postes 1 et 14)
 *
 * Nécessite Chrome ou Chromium. Chemin personnalisé : CHROME_PATH=/chemin/vers/chrome
 */
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createServer } from 'vite'
import { chromium } from 'playwright-core'

const root = resolve(import.meta.dirname, '..')
const outDir = join(root, 'src/assets/screens')
const stationsDir = join(root, 'src/content/stations')

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

const only = process.argv.slice(2).map(Number).filter(Number.isFinite)

const numbers = readdirSync(stationsDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(stationsDir, f), 'utf8')))
  .filter((s) => s.details?.screen)
  .map((s) => s.number)
  .filter((n) => only.length === 0 || only.includes(n))
  .sort((a, b) => a - b)

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
  for (const n of numbers) {
    await page.goto(`${url}?capture=${n}`)
    const screen = page.locator('#capture')
    await screen.waitFor()
    await page.evaluate(() => document.fonts.ready)
    const file = join(outDir, `station-${String(n).padStart(2, '0')}.jpg`)
    await screen.screenshot({ path: file, type: 'jpeg', quality: 85 })
    console.log(`✓ poste ${n} → ${file.replace(root + '/', '')}`)
  }
} finally {
  await browser.close()
  await server.close()
}
