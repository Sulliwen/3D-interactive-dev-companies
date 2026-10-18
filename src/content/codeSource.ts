/**
 * Extraits de code affichés sur les écrans simulés. Les lignes `// @zone <id>` et
 * `// @end` délimitent les zones où se posent les pastilles ; elles sont retirées
 * du code affiché.
 */

export interface CodeZone {
  id: string
  /** Première ligne de la zone (index 0, dans le code affiché). */
  from: number
  /** Dernière ligne incluse. */
  to: number
}

export interface ParsedCode {
  lines: string[]
  zones: CodeZone[]
}

const ZONE_START = /^\s*(?:\/\/|--|#)\s*@zone\s+([a-z0-9-]+)\s*$/
const ZONE_END = /^\s*(?:\/\/|--|#)\s*@end\s*$/

export function parseCodeSource(source: string): ParsedCode {
  const lines: string[] = []
  const zones: CodeZone[] = []
  let open: { id: string; from: number } | null = null

  for (const raw of source.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n')) {
    const start = ZONE_START.exec(raw)
    if (start) {
      if (open) throw new Error(`Zone « ${open.id} » non fermée avant « ${start[1]} »`)
      open = { id: start[1]!, from: lines.length }
      continue
    }
    if (ZONE_END.test(raw)) {
      if (!open) throw new Error('`@end` sans `@zone` correspondant')
      zones.push({ id: open.id, from: open.from, to: lines.length - 1 })
      open = null
      continue
    }
    lines.push(raw)
  }
  if (open) throw new Error(`Zone « ${open.id} » non fermée`)
  return { lines, zones }
}
