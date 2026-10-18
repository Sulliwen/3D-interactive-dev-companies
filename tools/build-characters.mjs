/**
 * Personnages : animations, composition des personnages, optimisation, miniatures.
 *
 *   npm run art:characters            tous les personnages
 *   npm run art:characters -- awa     seulement certains (identifiants de characters.json)
 *
 * Prérequis : les zips Quaternius décompressés dans art/sources/manuel/quaternius/
 * (voir docs/blender-pipeline.md), Blender 4.x, KTX-Software.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const blender = [process.env.BLENDER, join(homedir(), 'apps/blender/blender'), 'blender'].find(
  (p) => p && (p === 'blender' || existsSync(p)),
)
const ktxHome = process.env.KTX_HOME ?? join(homedir(), 'apps/ktx')
const env = {
  ...process.env,
  PATH: `${join(ktxHome, 'bin')}:${process.env.PATH}`,
  LD_LIBRARY_PATH: `${join(ktxHome, 'lib')}:${process.env.LD_LIBRARY_PATH ?? ''}`,
}
const build = join(root, 'art/build/characters')
const out = join(root, 'public/models/characters')
const thumbs = join(root, 'public/textures/avatars')

const run = (title, cmd, args) => {
  console.log(`\n▶ ${title}`)
  execFileSync(cmd, args, { cwd: root, env, stdio: 'inherit' })
}

mkdirSync(out, { recursive: true })
mkdirSync(thumbs, { recursive: true })

run('Animations (bibliothèque + gestes de bureau)', blender, [
  '--background',
  '--python',
  'tools/blender/build_animations.py',
])
run('Personnages', blender, [
  '--background',
  '--python',
  'tools/blender/build_characters.py',
  '--',
  ...only,
  '--preview',
])

const spec = JSON.parse(readFileSync(join(root, 'tools/blender/characters.json'), 'utf8'))
const everyone = [...spec.people, ...spec.avatars].filter(
  (p) => !only.length || only.includes(p.id),
)
for (const p of everyone) {
  run(`Optimisation ${p.id}`, 'npx', [
    'gltf-transform',
    'optimize',
    join(build, `${p.id}.glb`),
    join(out, `${p.id}.glb`),
    '--compress',
    'meshopt',
    '--texture-compress',
    'ktx2',
    '--texture-size',
    '1024',
    '--simplify',
    'false',
    '--join',
    'false',
    '--flatten',
    'false',
  ])
}
if (!only.length) {
  run('Optimisation des animations', 'npx', [
    'gltf-transform',
    'optimize',
    join(build, 'animations.glb'),
    join(out, 'animations.glb'),
    '--compress',
    'meshopt',
    '--texture-compress',
    'false',
    '--simplify',
    'false',
  ])
}
// Miniatures des avatars pour l'écran d'accueil.
for (const a of spec.avatars.filter((p) => !only.length || only.includes(p.id))) {
  run(`Miniature ${a.id}`, 'python3', [
    '-c',
    `from PIL import Image; im=Image.open('${join(build, `preview_${a.id}.png`)}').convert('RGB'); w,h=im.size; im.crop((int(w*0.1),0,int(w*0.9),h)).resize((240,400)).save('${join(thumbs, `${a.id}.jpg`)}', quality=86)`,
  ])
}
console.log('\n✓ Personnages prêts : public/models/characters/')
