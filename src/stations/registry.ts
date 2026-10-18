import type { ScreenDefinition } from './types'

/**
 * Types d'écrans simulés, découverts automatiquement : chaque dossier
 * `src/stations/<type>/` qui contient un `definition.ts` (export `screen`)
 * devient utilisable par les fiches via `"component": "<type>"`.
 * Un même type sert à plusieurs postes ; seules les données changent.
 */
const modules = import.meta.glob<ScreenDefinition>('./*/definition.ts', {
  eager: true,
  import: 'screen',
})

export const screens: Record<string, ScreenDefinition> = Object.fromEntries(
  Object.entries(modules).map(([path, def]) => [path.split('/')[1]!, def]),
)
