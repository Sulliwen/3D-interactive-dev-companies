/**
 * Chaîne complète « Blender → navigateur », en une commande :
 *
 *   npm run art:build              tout : assets, scène, précalcul, export, optimisation
 *   npm run art:build -- --quick   précalcul rapide (lightmaps 512 px) pour vérifier
 *   npm run art:export             garde art/<monde>.blend (vos retouches) et refait
 *                                  seulement précalcul + export + optimisation
 *   … -- --skip-bake               réutilise l'export précédent (art/build/<monde>) :
 *                                  optimisation seule
 *   … -- --world <monde>           l'étage à produire (par défaut : atelier-lumen)
 *
 * Étapes : assets Poly Haven (fetch_assets.py) → plan du jeu en JSON → visuels de décor
 * → scène Blender (build_scene.py) → lightmaps + glTF (bake_and_export.py)
 * → optimisation (gltf-transform : meshopt, textures KTX2) → public/models/<monde>/.
 *
 * Prérequis : Blender 4.x (BLENDER=… sinon ~/apps/blender/blender ou `blender`),
 * Python 3 + Pillow, KTX-Software (KTX_HOME=… sinon ~/apps/ktx).
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)
const quick = args.includes('--quick')
const exportOnly = args.includes('--export-only')
const rebuild = args.includes('--rebuild')
const skipBake = args.includes('--skip-bake')
const world = args.includes('--world') ? args[args.indexOf('--world') + 1] : 'atelier-lumen'

/** Scripts propres à chaque monde : scène Blender (depuis le plan) et visuels de décor. */
const SCENE_SCRIPTS = {
  'atelier-lumen': 'tools/blender/build_scene.py',
  'studio-lanterne': 'tools/blender/scene_studio_lanterne.py',
}
const DECOR_SCRIPTS = {
  'atelier-lumen': 'tools/blender/make_decor.py',
  'studio-lanterne': 'tools/blender/make_decor_studio.py',
}
if (!world || !SCENE_SCRIPTS[world]) {
  console.error(`Monde inconnu : ${world} (${Object.keys(SCENE_SCRIPTS).join(', ')})`)
  process.exit(1)
}

const blender = [process.env.BLENDER, join(homedir(), 'apps/blender/blender'), 'blender'].find(
  (p) => p && (p === 'blender' || existsSync(p)),
)
const ktxHome = process.env.KTX_HOME ?? join(homedir(), 'apps/ktx')
const env = {
  ...process.env,
  ART_WORLD: world,
  PATH: `${join(ktxHome, 'bin')}:${process.env.PATH}`,
  LD_LIBRARY_PATH: `${join(ktxHome, 'lib')}:${process.env.LD_LIBRARY_PATH ?? ''}`,
}

const build = join(root, 'art/build', world)
const models = join(root, 'public/models', world)
const blend = join(root, `art/${world}.blend`)

function step(title, cmd, cmdArgs) {
  console.log(`\n▶ ${title}`)
  execFileSync(cmd, cmdArgs, { cwd: root, env, stdio: 'inherit' })
}

if (!exportOnly && !skipBake) {
  step('Assets Poly Haven', 'python3', ['tools/blender/fetch_assets.py'])
}
if (!skipBake) {
  step('Plan de l’étage → JSON', 'node', ['tools/export-floorplan.mjs', world])
  step('Visuels de décor', 'python3', [DECOR_SCRIPTS[world]])
  if (!exportOnly && (rebuild || !existsSync(blend))) {
    step('Scène Blender', blender, [
      '--background',
      '--python',
      SCENE_SCRIPTS[world],
      '--',
      '--force',
    ])
  } else {
    console.log(`\n▶ Scène Blender : art/${world}.blend conservé (--rebuild pour le régénérer)`)
  }
  step('Précalcul de l’éclairage et export glTF', blender, [
    '--background',
    blend,
    '--python',
    'tools/blender/bake_and_export.py',
    '--',
    '--size',
    quick ? '512' : '2048',
    '--size-arch',
    quick ? '512' : '4096',
    '--samples',
    quick ? '16' : '128',
  ])
}

mkdirSync(models, { recursive: true })
// Optimisation en plusieurs passes : géométrie (meshopt), puis textures. Les couleurs et
// rugosités passent en ETC1S (compact) ; les normales, plus sensibles, en UASTC à 512 px.
const tmp = join(build, 'office.opt.glb')
const gt = (title, ...a) => step(title, 'npx', ['gltf-transform', ...a])
gt(
  'Géométrie (meshopt), nettoyage',
  'optimize',
  join(build, 'office.glb'),
  tmp,
  '--compress',
  'meshopt',
  '--texture-compress',
  'false',
  '--join',
  'false',
  '--flatten',
  'false',
  '--simplify',
  'false',
  '--palette',
  'false',
  // Garder TEXCOORD_1 : la lightmap n'est branchée qu'au chargement, dans le jeu.
  '--prune-attributes',
  'false',
)
gt('Textures ≤ 1024 px', 'resize', tmp, tmp, '--width', '1024', '--height', '1024')
gt(
  'Normales ≤ 512 px',
  'resize',
  tmp,
  tmp,
  '--pattern',
  '*nor_gl*',
  '--width',
  '512',
  '--height',
  '512',
)
gt(
  'Couleurs et rugosités → KTX2 ETC1S',
  'etc1s',
  tmp,
  tmp,
  '--slots',
  '{baseColorTexture,metallicRoughnessTexture,emissiveTexture,occlusionTexture}',
  '--quality',
  '160',
)
gt(
  'Normales → KTX2 UASTC',
  'uastc',
  tmp,
  join(models, 'office.glb'),
  '--slots',
  'normalTexture',
  '--level',
  '2',
  '--rdo',
  '--zstd',
  '18',
)

const meta = JSON.parse(readFileSync(join(build, 'office.json'), 'utf8'))
for (const [node, lm] of Object.entries(meta.lightmaps)) {
  const out = lm.file.replace(/\.png$/, '.ktx2')
  step(`Lightmap ${node} → KTX2`, 'ktx', [
    'create',
    '--format',
    'R8G8B8_SRGB',
    '--assign-tf',
    'srgb',
    '--encode',
    'uastc',
    '--uastc-quality',
    '2',
    '--zstd',
    '18',
    '--generate-mipmap',
    join(build, lm.file),
    join(models, out),
  ])
  lm.file = out
}
writeFileSync(join(models, 'office.json'), JSON.stringify(meta, null, 2))

step('Ciel (arrière-plan et reflets)', 'python3', [
  '-c',
  `from PIL import Image; Image.MAX_IMAGE_PIXELS=None; im=Image.open('art/sources/hdri/sky_tonemapped.jpg').convert('RGB'); im.resize((4096,2048), Image.LANCZOS).save('public/textures/sky.jpg', quality=84)`,
])

// Décodeur Basis (KTX2) servi avec l'application.
mkdirSync(join(root, 'public/basis'), { recursive: true })
for (const f of ['basis_transcoder.js', 'basis_transcoder.wasm']) {
  copyFileSync(
    join(root, 'node_modules/three/examples/jsm/libs/basis', f),
    join(root, 'public/basis', f),
  )
}

// Crédits des assets tiers, tenus à jour dans CREDITS.md.
const credits = JSON.parse(readFileSync(join(root, 'art/sources/credits.json'), 'utf8'))
const rows = credits
  .map(
    (c) =>
      `| ${c.name} | ${c.authors.join(', ')} | [Poly Haven](${c.url}) | ${c.license} | ${c.use} |`,
  )
  .join('\n')
const creditsFile = join(root, 'CREDITS.md')
const md = readFileSync(creditsFile, 'utf8')
const block = `<!-- assets:start -->\n| Asset | Auteur(s) | Source | Licence | Utilisé pour |\n| ----- | --------- | ------ | ------- | ------------ |\n${rows}\n<!-- assets:end -->`
writeFileSync(
  creditsFile,
  md.includes('<!-- assets:start -->')
    ? md.replace(/<!-- assets:start -->[\s\S]*<!-- assets:end -->/, block)
    : // Le premier tableau (en-tête aligné par Prettier : espaces variables après « Asset »).
      md.replace(/\| Asset +\|[\s\S]*?\n\n/, `${block}\n\n`),
)

console.log(
  `\n✓ Passe artistique terminée : public/models/${world}/office.glb, lightmaps, ciel, crédits.`,
)
