import { z } from 'zod'
import {
  glossarySchema,
  roleSchema,
  scenarioSchema,
  stepSchema,
  structureSchema,
  upcomingSchema,
  type GlossaryEntry,
  type Role,
  type Scenario,
  type Station,
  type Step,
  type Structure,
  type UpcomingStructure,
} from './schema'
import { glossaryRefs } from './richText'
import { parseCodeSource, type ParsedCode } from './codeSource'
import upcomingJson from './structures/upcoming.json'

export class ContentError extends Error {
  override name = 'ContentError'
}

/** Un scénario et ses étapes, triées (parcours, puis postes bonus). */
export interface ScenarioBundle {
  scenario: Scenario
  steps: Step[]
}

/** Une structure, ses métiers (triés par poste) et ses scénarios (triés). */
export interface StructureBundle {
  structure: Structure
  roles: Role[]
  scenarios: ScenarioBundle[]
}

/** Fichiers bruts du dossier `structures/`, par chemin (`./structures/<id>/…`). */
export type ContentFiles = Record<string, unknown>

function parseFile<S extends z.ZodType>(schema: S, path: string, raw: unknown): z.output<S> {
  const result = schema.safeParse(raw)
  if (!result.success) {
    throw new ContentError(`Fichier invalide « ${path} » :\n${z.prettifyError(result.error)}`)
  }
  return result.data
}

/** Fichiers dont le chemin correspond, sous la forme [captures du motif, chemin, contenu]. */
function matching(files: ContentFiles, pattern: RegExp): Array<[string[], string, unknown]> {
  return Object.entries(files)
    .map(([path, raw]) => [pattern.exec(path), path, raw] as const)
    .filter((m): m is [RegExpExecArray, string, unknown] => m[0] !== null)
    .map(([m, path, raw]) => [m.slice(1), path, raw])
}

/**
 * Valide tout le contenu des structures. Les erreurs citent le fichier fautif pour qu'un·e
 * rédacteur·rice s'y retrouve. Les vérifications de cohérence plus fines (glossaire,
 * écrans) sont faites par les tests.
 */
export function parseStructures(files: ContentFiles): StructureBundle[] {
  const bundles = matching(files, /^\.\/structures\/([^/]+)\/structure\.json$/).map(
    ([[dir], path, raw]): StructureBundle => {
      const structure = parseFile(structureSchema, path, raw)
      if (structure.id !== dir) {
        throw new ContentError(`« ${path} » : l'identifiant doit être « ${dir} » (nom du dossier).`)
      }
      return { structure, roles: [], scenarios: [] }
    },
  )
  const byDir = new Map(bundles.map((b) => [b.structure.id, b]))
  const bundleFor = (dir: string, path: string) => {
    const b = byDir.get(dir)
    if (!b) throw new ContentError(`« ${path} » : dossier sans structure.json.`)
    return b
  }

  for (const [[dir], path, raw] of matching(
    files,
    /^\.\/structures\/([^/]+)\/roles\/[^/]+\.json$/,
  )) {
    const b = bundleFor(dir!, path)
    const role = parseFile(roleSchema, path, raw)
    const twin = b.roles.find((r) => r.id === role.id || r.desk === role.desk)
    if (twin) {
      throw new ContentError(
        `« ${path} » : le métier « ${twin.id} » a déjà cet identifiant ou ce poste (${role.desk}).`,
      )
    }
    b.roles.push(role)
  }

  const scenarioFiles = /^\.\/structures\/([^/]+)\/scenarios\/([^/]+)\/scenario\.json$/
  for (const [[dir, scenarioDir], path, raw] of matching(files, scenarioFiles)) {
    const scenario = parseFile(scenarioSchema, path, raw)
    if (scenario.id !== scenarioDir) {
      throw new ContentError(`« ${path} » : l'identifiant doit être « ${scenarioDir} ».`)
    }
    bundleFor(dir!, path).scenarios.push({ scenario, steps: [] })
  }

  const stepFiles = /^\.\/structures\/([^/]+)\/scenarios\/([^/]+)\/steps\/[^/]+\.json$/
  for (const [[dir, scenarioDir], path, raw] of matching(files, stepFiles)) {
    const b = bundleFor(dir!, path)
    const sb = b.scenarios.find((s) => s.scenario.id === scenarioDir)
    if (!sb) throw new ContentError(`« ${path} » : dossier sans scenario.json.`)
    const step = parseFile(stepSchema, path, raw)
    if (!b.roles.some((r) => r.id === step.role)) {
      throw new ContentError(`« ${path} » : métier « ${step.role} » inconnu dans ${dir}/roles.`)
    }
    if (sb.steps.some((s) => s.role === step.role)) {
      throw new ContentError(`« ${path} » : le métier « ${step.role} » a déjà une étape.`)
    }
    if (step.offPath === (step.order !== undefined)) {
      throw new ContentError(`« ${path} » : une étape a soit un « order », soit « offPath: true ».`)
    }
    sb.steps.push(step)
  }

  for (const b of bundles) {
    b.roles.sort((x, y) => x.desk - y.desk)
    b.scenarios.sort((x, y) => x.scenario.order - y.scenario.order)
    for (const sb of b.scenarios) checkScenario(b, sb)
  }
  return bundles.sort((x, y) => x.structure.order - y.structure.order)
}

function checkScenario(b: StructureBundle, sb: ScenarioBundle) {
  const where = `${b.structure.id}/${sb.scenario.id}`
  sb.steps.sort((x, y) => (x.order ?? Infinity) - (y.order ?? Infinity))
  const orders = sb.steps.flatMap((s) => (s.order === undefined ? [] : [s.order]))
  orders.forEach((o, i) => {
    if (o !== i + 1) {
      throw new ContentError(`${where} : les étapes doivent être numérotées 1, 2, 3… sans trou.`)
    }
  })
  if (orders.length === 0) throw new ContentError(`${where} : aucune étape dans le parcours.`)
  const involved = new Set(sb.steps.map((s) => s.role))
  for (const s of sb.steps) {
    for (const r of [...s.receivesFrom.roles, ...s.handsOffTo.roles]) {
      if (!involved.has(r)) {
        throw new ContentError(`${where}, étape « ${s.role} » : « ${r} » n'intervient pas ici.`)
      }
    }
  }
  for (const by of sb.scenario.bystanders) {
    if (!b.roles.some((r) => r.id === by.role) || involved.has(by.role)) {
      throw new ContentError(`${where} : « ${by.role} » ne peut pas être hors scénario.`)
    }
    if (by.absent && by.screenFrom) {
      throw new ContentError(`${where} : « ${by.role} » est absent, son écran est éteint.`)
    }
    if (by.screenFrom) {
      const other = b.scenarios.find((o) => o.scenario.id === by.screenFrom)
      if (!other) throw new ContentError(`${where} : scénario « ${by.screenFrom} » inconnu.`)
    }
  }
}

// Chaque fichier JSON de `structures/` est découvert automatiquement : ajouter un métier,
// un scénario ou une étape = ajouter un fichier, sans toucher au code.
export const structures: StructureBundle[] = parseStructures(
  import.meta.glob<unknown>('./structures/*/**/*.json', { eager: true, import: 'default' }),
)

export const upcomingStructures: UpcomingStructure[] = upcomingSchema.parse(upcomingJson)

// --- Visite : une structure et un scénario choisis -------------------------------------

export interface VisitRef {
  structure: string
  scenario: string
}

export interface Visit {
  /** `structure/scénario`, clé de la progression. */
  key: string
  structure: Structure
  scenario: Scenario
  /** Tous les postes de l'étage : parcours dans l'ordre, puis bonus, puis hors scénario. */
  stations: Station[]
  /** Le parcours, dans l'ordre. */
  pathStations: Station[]
}

export const visitKey = (ref: VisitRef): string => `${ref.structure}/${ref.scenario}`

export const defaultVisitRef: VisitRef = {
  structure: structures[0]!.structure.id,
  scenario: structures[0]!.scenarios[0]!.scenario.id,
}

export function findStructure(id: string): StructureBundle | undefined {
  return structures.find((b) => b.structure.id === id)
}

export function isKnownVisit(ref: VisitRef): boolean {
  return !!findStructure(ref.structure)?.scenarios.some((s) => s.scenario.id === ref.scenario)
}

/** Assemble les postes d'une visite : chaque métier, et ce qu'il fait dans ce scénario. */
export function buildVisit(b: StructureBundle, sb: ScenarioBundle): Visit {
  const deskOf = new Map(b.roles.map((r) => [r.id, r.desk]))
  const desks = (roles: string[]) => roles.map((r) => deskOf.get(r)!)
  const common = (role: Role) => ({
    id: role.id,
    desk: role.desk,
    title: role.title,
    person: role.person,
    tagline: role.tagline,
    missions: role.missions,
    myth: role.myth,
    realTools: role.realTools,
  })

  const stations: Station[] = sb.steps.map((step) => {
    const role = b.roles.find((r) => r.id === step.role)!
    return {
      ...common(role),
      status: step.offPath ? 'bonus' : 'path',
      step: step.order ?? null,
      featureStep: step.featureStep,
      tagline: step.tagline ?? role.tagline,
      missions: step.missions ?? role.missions,
      takeaways: step.takeaways,
      receivesFrom: { stations: desks(step.receivesFrom.roles), text: step.receivesFrom.text },
      handsOffTo: { stations: desks(step.handsOffTo.roles), text: step.handsOffTo.text },
      screen: step.screen,
      screenScenario: sb.scenario.id,
    }
  })

  for (const role of b.roles) {
    if (stations.some((s) => s.id === role.id)) continue
    const by = sb.scenario.bystanders.find((x) => x.role === role.id)
    const source = by?.screenFrom
      ? b.scenarios
          .find((o) => o.scenario.id === by.screenFrom)
          ?.steps.find((s) => s.role === role.id)
      : undefined
    stations.push({
      ...common(role),
      status: 'bystander',
      step: null,
      featureStep: by?.note ?? "Ce poste n'intervient pas dans ce scénario.",
      screen: source?.screen,
      screenScenario: source ? by!.screenFrom : undefined,
      absent: by?.absent || undefined,
    })
  }

  return {
    key: visitKey({ structure: b.structure.id, scenario: sb.scenario.id }),
    structure: b.structure,
    scenario: sb.scenario,
    stations,
    pathStations: stations.filter((s) => s.status === 'path'),
  }
}

const visits = new Map<string, Visit>()

/** La visite demandée (assemblée une seule fois), ou la visite par défaut si elle n'existe plus. */
export function getVisit(ref: VisitRef | null): Visit {
  const r = ref && isKnownVisit(ref) ? ref : defaultVisitRef
  const key = visitKey(r)
  let visit = visits.get(key)
  if (!visit) {
    const b = findStructure(r.structure)!
    visit = buildVisit(
      b,
      b.scenarios.find((s) => s.scenario.id === r.scenario)!,
    )
    visits.set(key, visit)
  }
  return visit
}

export function stationAtDesk(visit: Visit, desk: number): Station | undefined {
  return visit.stations.find((s) => s.desk === desk)
}

/** Libellé court d'un poste : « 3. Data » dans le parcours, « Data » sinon. */
export function stationLabel(s: Station): string {
  return s.step === null ? s.title : `${s.step}. ${s.title}`
}

/** Tous les textes enrichis d'une fiche (pour vérifier les renvois au glossaire). */
export function stationRichTexts(station: Station): string[] {
  return [
    station.tagline,
    ...station.missions,
    ...(station.takeaways ?? []),
    station.myth.myth,
    station.myth.reality,
    ...(station.status === 'bystander' ? [station.featureStep] : []),
    ...(station.receivesFrom ? [station.receivesFrom.text] : []),
    ...(station.handsOffTo ? [station.handsOffTo.text] : []),
    ...(station.screen?.annotations.map((a) => a.text) ?? []),
  ]
}

/** Termes du glossaire utilisés par une fiche, dans l'ordre d'apparition. */
export function stationGlossaryIds(station: Station): string[] {
  return [...new Set(stationRichTexts(station).flatMap(glossaryRefs))]
}

// --- Glossaire ----------------------------------------------------------------------------

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
