import { describe, expect, it } from 'vitest'

// Feuilles de style des écrans : chaque type d'écran a son propre préfixe de classes
// (`.pl`, `.pl__…`). Deux écrans avec le même préfixe se déforment l'un l'autre.
const sheets = import.meta.glob<string>('./*/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
})

describe('styles des écrans', () => {
  it('chaque type d’écran a son propre préfixe de classes', () => {
    const owners = new Map<string, Set<string>>()
    for (const [path, css] of Object.entries(sheets)) {
      const type = path.split('/')[1]!
      if (type === 'common') continue
      // Blocs déclarés en début de règle : `.bloc {`, `.bloc__élément`, `.bloc--variante`.
      for (const m of css.matchAll(/^\.([a-z][a-z0-9]*(?:-[a-z0-9]+)*)(?=__|--|[\s{,:])/gm)) {
        const block = m[1]!
        if (!owners.has(block)) owners.set(block, new Set())
        owners.get(block)!.add(type)
      }
    }
    const shared = [...owners]
      .filter(([, types]) => types.size > 1)
      .map(([b, t]) => `${b}: ${[...t]}`)
    expect(shared).toEqual([])
  })
})
