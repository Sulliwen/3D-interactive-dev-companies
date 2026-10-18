/**
 * Sons d'ambiance : copie les 4 fichiers Freesound depuis le dossier Téléchargements
 * (Windows via WSL, ou ~/Downloads) puis les prépare avec Blender.
 *
 *   npm run audio:build
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const dest = join(root, 'art/sources/manuel/audio')
const ids = ['534123', '636861', '396304', '832445']
const downloads = [
  join(homedir(), 'Downloads'),
  join(homedir(), 'Téléchargements'),
  ...(existsSync('/mnt/c/Users')
    ? readdirSync('/mnt/c/Users').map((u) => `/mnt/c/Users/${u}/Downloads`)
    : []),
].filter((d) => {
  try {
    return existsSync(d) && readdirSync(d) && true
  } catch {
    return false
  }
})

mkdirSync(dest, { recursive: true })
for (const id of ids) {
  if (readdirSync(dest).some((f) => f.startsWith(`${id}__`))) continue
  const dir = downloads.find((d) => readdirSync(d).some((f) => f.startsWith(`${id}__`)))
  if (!dir) {
    console.error(`Son ${id} introuvable dans : ${downloads.join(', ')}`)
    process.exit(1)
  }
  const file = readdirSync(dir).find((f) => f.startsWith(`${id}__`))
  copyFileSync(join(dir, file), join(dest, file))
  console.log(`↓ ${file}`)
}
const blender = [process.env.BLENDER, join(homedir(), 'apps/blender/blender'), 'blender'].find(
  (p) => p && (p === 'blender' || existsSync(p)),
)
execFileSync(blender, ['--background', '--python', 'tools/blender/build_audio.py'], {
  cwd: root,
  stdio: 'inherit',
})
