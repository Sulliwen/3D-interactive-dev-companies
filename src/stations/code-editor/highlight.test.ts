import { describe, expect, it } from 'vitest'
import { highlightLines } from './highlight'

const kinds = (line: string) =>
  highlightLines([line])[0]!
    .filter((t) => t.text.trim())
    .map((t) => ({ ...t, text: t.text.trim() }))

describe('coloration syntaxique', () => {
  it('distingue mots-clés, fonctions, chaînes et commentaires', () => {
    expect(kinds("const x = await load('a') // note")).toEqual([
      { kind: 'keyword', text: 'const' },
      { kind: 'plain', text: 'x =' },
      { kind: 'keyword', text: 'await' },
      { kind: 'function', text: 'load' },
      { kind: 'plain', text: '(' },
      { kind: 'string', text: "'a'" },
      { kind: 'plain', text: ')' },
      { kind: 'comment', text: '// note' },
    ])
  })

  it('suit une chaîne sur plusieurs lignes (requête SQL)', () => {
    const [a, b] = highlightLines(['q(`UPDATE slots', "  SET status = 'x'`)"])
    expect(a!.at(-1)).toEqual({ kind: 'string', text: '`UPDATE slots' })
    expect(b![0]).toEqual({ kind: 'string', text: "  SET status = 'x'`" })
    expect(b![1]).toEqual({ kind: 'plain', text: ')' })
  })
})
