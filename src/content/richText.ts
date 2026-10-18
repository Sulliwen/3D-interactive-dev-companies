/** Analyse du texte enrichi des fiches (sans React, testable). */

export type RichSegment =
  | { kind: 'text'; text: string }
  | { kind: 'term'; id: string; text: string | null }
  | { kind: 'strong'; text: string }
  | { kind: 'code'; text: string }

const TOKEN = /\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]|\*\*([^*]+)\*\*|`([^`]+)`/g

export function parseRichText(input: string): RichSegment[] {
  const segments: RichSegment[] = []
  let last = 0
  for (const m of input.matchAll(TOKEN)) {
    const index = m.index
    if (index > last) segments.push({ kind: 'text', text: input.slice(last, index) })
    if (m[1] !== undefined) segments.push({ kind: 'term', id: m[1], text: m[2] ?? null })
    else if (m[3] !== undefined) segments.push({ kind: 'strong', text: m[3] })
    else if (m[4] !== undefined) segments.push({ kind: 'code', text: m[4] })
    last = index + m[0].length
  }
  if (last < input.length) segments.push({ kind: 'text', text: input.slice(last) })
  return segments
}

/** Identifiants de glossaire cités dans un texte. */
export function glossaryRefs(input: string): string[] {
  return parseRichText(input).flatMap((s) => (s.kind === 'term' ? [s.id] : []))
}

/** Rend un texte enrichi en texte brut (pour les lecteurs d'écran, la recherche…). */
export function plainText(input: string, termLabel: (id: string) => string): string {
  return parseRichText(input)
    .map((s) => (s.kind === 'term' ? (s.text ?? termLabel(s.id)) : s.text))
    .join('')
}

/**
 * Libellé d'un terme au fil du texte : « Sprint » devient « sprint », mais les
 * sigles (« API ») restent en capitales.
 */
export function inlineLabel(term: string): string {
  const second = term.charAt(1)
  return second && second === second.toLowerCase()
    ? term.charAt(0).toLowerCase() + term.slice(1)
    : term
}
