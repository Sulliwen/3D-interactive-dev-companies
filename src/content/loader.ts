import { z } from 'zod'
import {
  companySchema,
  glossarySchema,
  stationSchema,
  type Company,
  type GlossaryEntry,
  type Station,
} from './schema'
import { glossaryRefs } from './richText'
import { parseCodeSource, type ParsedCode } from './codeSource'
import companyJson from './company.json'

export class ContentError extends Error {
  override name = 'ContentError'
}

/**
 * Valide un ensemble de fiches station (fichier → contenu brut).
 * Les erreurs citent le fichier fautif pour qu'un·e rédacteur·rice s'y retrouve.
 */
export function parseStations(files: Record<string, unknown>): Station[] {
  const stations: Station[] = []
  for (const [path, raw] of Object.entries(files)) {
    const result = stationSchema.safeParse(raw)
    if (!result.success) {
      throw new ContentError(`Fiche invalide « ${path} » :\n${z.prettifyError(result.error)}`)
    }
    stations.push(result.data)
  }

  stations.sort((a, b) => a.number - b.number)
  const ids = new Set<string>()
  for (let i = 0; i < stations.length; i++) {
    const cur = stations[i]!
    const prev = stations[i - 1]
    if (prev && prev.number === cur.number) {
      throw new ContentError(
        `Deux fiches portent le numéro ${cur.number} : « ${prev.id} » et « ${cur.id} ».`,
      )
    }
    if (ids.has(cur.id)) throw new ContentError(`Identifiant en double : « ${cur.id} ».`)
    ids.add(cur.id)
  }
  return stations
}

/** Tous les textes enrichis d'une fiche (pour vérifier les renvois au glossaire). */
export function stationRichTexts(station: Station): string[] {
  const d = station.details
  if (!d) return []
  return [
    d.tagline,
    ...d.missions,
    ...d.takeaways,
    d.myth.myth,
    d.myth.reality,
    d.receivesFrom.text,
    d.handsOffTo.text,
    ...d.screen.annotations.map((a) => a.text),
  ]
}

/** Termes du glossaire utilisés par une fiche, dans l'ordre d'apparition. */
export function stationGlossaryIds(station: Station): string[] {
  return [...new Set(stationRichTexts(station).flatMap(glossaryRefs))]
}

// Chaque fichier JSON de `stations/` est découvert automatiquement :
// ajouter un poste = ajouter un fichier, sans toucher au code.
const stationFiles = import.meta.glob<unknown>('./stations/*.json', {
  eager: true,
  import: 'default',
})

export const stations: Station[] = parseStations(stationFiles)

/** Les postes du fil rouge, dans l'ordre (sans les postes bonus). */
export const pathStations: Station[] = stations.filter((s) => !s.offPath)

export const company: Company = companySchema.parse(companyJson)

/**
 * Glossaire, réparti en plusieurs fichiers (`glossary/*.json`) pour que chaque
 * poste puisse apporter ses mots. Un même identifiant ne doit apparaître qu'une fois.
 */
export function parseGlossary(files: Record<string, unknown>): GlossaryEntry[] {
  const entries: GlossaryEntry[] = []
  const origin = new Map<string, string>()
  for (const [path, raw] of Object.entries(files)) {
    const result = glossarySchema.safeParse(raw)
    if (!result.success) {
      throw new ContentError(`Glossaire invalide « ${path} » :\n${z.prettifyError(result.error)}`)
    }
    for (const entry of result.data) {
      const first = origin.get(entry.id)
      if (first)
        throw new ContentError(`Terme « ${entry.id} » défini deux fois : ${first} et ${path}.`)
      origin.set(entry.id, path)
      entries.push(entry)
    }
  }
  return entries.sort((a, b) => a.term.localeCompare(b.term, 'fr'))
}

export const glossary: GlossaryEntry[] = parseGlossary(
  import.meta.glob<unknown>('./glossary/*.json', { eager: true, import: 'default' }),
)

const glossaryById = new Map(glossary.map((g) => [g.id, g]))

export function getGlossaryEntry(id: string): GlossaryEntry | undefined {
  return glossaryById.get(id)
}

export function getStationByNumber(n: number): Station | undefined {
  return stations.find((s) => s.number === n)
}

// Extraits de code des écrans simulés, chargés comme texte brut.
const codeFiles = import.meta.glob<string>('./screens/**/*.txt', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const parsedCode = new Map<string, ParsedCode>()

/** Code d'un écran, référencé par son chemin relatif à `content/screens/`. */
export function getCodeSource(path: string): ParsedCode | undefined {
  const cached = parsedCode.get(path)
  if (cached) return cached
  const raw = codeFiles[`./screens/${path}`]
  if (raw === undefined) return undefined
  const parsed = parseCodeSource(raw)
  parsedCode.set(path, parsed)
  return parsed
}
