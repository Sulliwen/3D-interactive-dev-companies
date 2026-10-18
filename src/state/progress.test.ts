import { describe, expect, it } from 'vitest'
import { emptyProgress, markVisited, nextStation, sanitizeProgress, visitedCount } from './progress'

const ids = ['support', 'ux-research', 'data']

describe('progression', () => {
  it('marque un poste comme vu une seule fois', () => {
    const p = markVisited(markVisited(emptyProgress, 'data'), 'data')
    expect(p.visited).toEqual(['data'])
  })

  it('propose le premier poste non vu dans l’ordre du fil rouge', () => {
    expect(nextStation(emptyProgress, ids)).toBe('support')
    expect(nextStation({ visited: ['support', 'data'] }, ids)).toBe('ux-research')
    expect(nextStation({ visited: ids }, ids)).toBeNull()
  })

  it('ne compte que les postes encore présents dans le contenu', () => {
    expect(visitedCount({ visited: ['support', 'ancien-poste'] }, ids)).toBe(1)
  })

  it('nettoie une progression corrompue ou obsolète', () => {
    expect(sanitizeProgress(null, ids)).toEqual(emptyProgress)
    expect(sanitizeProgress({ visited: 'oups' }, ids)).toEqual(emptyProgress)
    expect(sanitizeProgress({ visited: ['data', 42, 'data', 'inconnu'] }, ids)).toEqual({
      visited: ['data'],
    })
  })
})
