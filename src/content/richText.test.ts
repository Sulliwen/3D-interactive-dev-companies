import { describe, expect, it } from 'vitest'
import { glossaryRefs, parseRichText, plainText } from './richText'

describe('texte enrichi', () => {
  it('reconnaît termes du glossaire, gras et code', () => {
    expect(parseRichText("L'[[api|API]] du [[serveur]] **vite** : `if`.")).toEqual([
      { kind: 'text', text: "L'" },
      { kind: 'term', id: 'api', text: 'API' },
      { kind: 'text', text: ' du ' },
      { kind: 'term', id: 'serveur', text: null },
      { kind: 'text', text: ' ' },
      { kind: 'strong', text: 'vite' },
      { kind: 'text', text: ' : ' },
      { kind: 'code', text: 'if' },
      { kind: 'text', text: '.' },
    ])
  })

  it('laisse un texte simple intact', () => {
    expect(parseRichText('Bonjour')).toEqual([{ kind: 'text', text: 'Bonjour' }])
  })

  it('liste les renvois au glossaire', () => {
    expect(glossaryRefs('[[a]] et [[b|B]]')).toEqual(['a', 'b'])
  })

  it('produit du texte brut', () => {
    expect(plainText('Une [[api]] et **du gras**', () => 'API')).toBe('Une API et du gras')
  })
})
