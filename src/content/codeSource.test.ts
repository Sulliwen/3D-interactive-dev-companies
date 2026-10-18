import { describe, expect, it } from 'vitest'
import { parseCodeSource } from './codeSource'

describe('extraits de code', () => {
  it('retire les marqueurs et calcule les lignes de chaque zone', () => {
    const parsed = parseCodeSource(
      ['a()', '// @zone regle', 'if (x) {', '}', '// @end', 'b()', ''].join('\n'),
    )
    expect(parsed.lines).toEqual(['a()', 'if (x) {', '}', 'b()'])
    expect(parsed.zones).toEqual([{ id: 'regle', from: 1, to: 2 }])
  })

  it('accepte les commentaires SQL', () => {
    expect(parseCodeSource('-- @zone q\nSELECT 1\n-- @end').zones).toEqual([
      { id: 'q', from: 0, to: 0 },
    ])
  })

  it('signale une zone mal fermée', () => {
    expect(() => parseCodeSource('// @zone a\nx')).toThrow(/non fermée/)
    expect(() => parseCodeSource('x\n// @end')).toThrow(/@end/)
  })
})
