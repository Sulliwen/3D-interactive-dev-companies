import { describe, expect, it } from 'vitest'
import {
  ContentError,
  buildVisit,
  getCodeSource,
  getGlossaryEntry,
  getVisit,
  glossary,
  parseStructures,
  stationGlossaryIds,
  structures,
} from './loader'
import { floorPlan } from '../engine/world/floorplan'
import { screens } from '../stations/registry'

const S = './structures/s'
const structure = {
  id: 's',
  order: 1,
  name: 'Société',
  kind: 'Type',
  tagline: 'Accroche',
  summary: 'Résumé',
  facts: ['Fait'],
  world: 'w',
  projects: [],
}
const role = (id: string, desk: number) => ({
  id,
  desk,
  title: 'Titre',
  person: { firstName: 'A', lastName: 'B', role: 'R' },
  tagline: 'Accroche',
  missions: ['a', 'b', 'c'],
  myth: { myth: 'm', reality: 'r' },
  realTools: ['Outil'],
})
const scenario = (bystanders: unknown[] = []) => ({
  id: 'sc',
  order: 1,
  kind: 'Type',
  title: 'Titre',
  summary: 'Résumé',
  workItem: { label: 'Label', title: 'Titre', project: 'p' },
  intro: 'Intro',
  finale: { lead: 'Fin', outcomesTitle: 'Résultats', outcomes: [] },
  bystanders,
})
const step = (r: string, order: number | undefined, to: string[] = [r]) => ({
  role: r,
  ...(order === undefined ? { offPath: true } : { order }),
  featureStep: 'Étape',
  takeaways: ['a', 'b', 'c'],
  receivesFrom: { roles: to, text: 't' },
  handsOffTo: { roles: to, text: 't' },
  screen: {
    component: 'c',
    toolName: 'T',
    props: {},
    annotations: ['x', 'y', 'z'].map((id) => ({ id, zone: id, title: id, text: id })),
  },
})
const files = (extra: Record<string, unknown> = {}) => ({
  [`${S}/structure.json`]: structure,
  [`${S}/roles/a.json`]: role('a', 1),
  [`${S}/roles/b.json`]: role('b', 2),
  [`${S}/roles/c.json`]: role('c', 3),
  [`${S}/scenarios/sc/scenario.json`]: scenario([{ role: 'c', note: 'Ailleurs' }]),
  [`${S}/scenarios/sc/steps/2.json`]: step('b', 2, ['a']),
  [`${S}/scenarios/sc/steps/1.json`]: step('a', 1, ['b']),
  ...extra,
})

describe('chargement du contenu', () => {
  it('assemble une visite : parcours trié, puis postes hors scénario', () => {
    const [b] = parseStructures(files())
    const visit = buildVisit(b!, b!.scenarios[0]!)
    expect(visit.key).toBe('s/sc')
    expect(visit.stations.map((s) => [s.id, s.status, s.step])).toEqual([
      ['a', 'path', 1],
      ['b', 'path', 2],
      ['c', 'bystander', null],
    ])
    expect(visit.stations[1]!.receivesFrom?.stations).toEqual([1])
    expect(visit.stations[2]!.featureStep).toBe('Ailleurs')
  })

  it('signale le fichier fautif', () => {
    expect(() => parseStructures(files({ [`${S}/roles/x.json`]: { id: 'X X' } }))).toThrow(
      /roles\/x\.json/,
    )
  })

  it('refuse deux métiers au même poste', () => {
    expect(() => parseStructures(files({ [`${S}/roles/d.json`]: role('d', 1) }))).toThrow(
      ContentError,
    )
  })

  it('refuse un parcours troué ou un renvoi vers un poste absent du scénario', () => {
    expect(() =>
      parseStructures(files({ [`${S}/scenarios/sc/steps/2.json`]: step('b', 3, ['a']) })),
    ).toThrow(/sans trou/)
    expect(() =>
      parseStructures(files({ [`${S}/scenarios/sc/steps/2.json`]: step('b', 2, ['c']) })),
    ).toThrow(/n'intervient pas/)
  })

  it('un poste absent (pas encore arrivé) a un bureau vide, sans écran', () => {
    const absent = scenario([{ role: 'c', note: 'Arrive en 2025', absent: true }])
    const [b] = parseStructures(files({ [`${S}/scenarios/sc/scenario.json`]: absent }))
    const c = buildVisit(b!, b!.scenarios[0]!).stations[2]!
    expect([c.absent, c.screen]).toEqual([true, undefined])
    const withScreen = scenario([{ role: 'c', note: 'x', absent: true, screenFrom: 'sc' }])
    expect(() =>
      parseStructures(files({ [`${S}/scenarios/sc/scenario.json`]: withScreen })),
    ).toThrow(/éteint/)
  })

  it('les visites inconnues retombent sur la visite par défaut', () => {
    expect(getVisit({ structure: 'nulle-part', scenario: 'x' }).key).toBe(getVisit(null).key)
  })

  it('le glossaire n’a pas de doublon', () => {
    expect(new Set(glossary.map((g) => g.id)).size).toBe(glossary.length)
  })
})

const captures = new Set(
  Object.keys(import.meta.glob('../assets/screens/*/*/station-*.jpg')).map((p) =>
    p.replace('../assets/screens/', ''),
  ),
)

for (const b of structures) {
  describe(`structure ${b.structure.id}`, () => {
    it('chaque métier a son poste dans le plan de l’étage', () => {
      const anchors = new Set(floorPlan.stations.map((a) => a.number))
      for (const r of b.roles) expect(anchors.has(r.desk), `poste ${r.desk}`).toBe(true)
    })

    for (const sb of b.scenarios) {
      const visit = buildVisit(b, sb)
      describe(`scénario ${sb.scenario.id}`, () => {
        it('chaque métier absent du parcours dit ce qu’il fait pendant ce temps', () => {
          const silent = visit.stations
            .filter((s) => s.status === 'bystander')
            .filter((s) => !sb.scenario.bystanders.some((x) => x.role === s.id))
          expect(silent.map((s) => s.id)).toEqual([])
        })

        for (const station of visit.stations) {
          describe(`poste ${station.desk} · ${station.id}`, () => {
            it('chaque terme cité existe dans le glossaire', () => {
              const missing = stationGlossaryIds(station).filter((id) => !getGlossaryEntry(id))
              expect(missing).toEqual([])
            })

            const screen = station.screen
            if (!screen) return

            it('a son image vue de loin (npm run screens:capture)', () => {
              const file = `${b.structure.id}/${station.screenScenario}/station-${String(station.desk).padStart(2, '0')}.jpg`
              expect(captures.has(file), file).toBe(true)
            })

            it('l’écran simulé existe et ses données sont valides', () => {
              const schema = screens[screen.component]
              expect(schema, screen.component).toBeDefined()
              expect(() => schema!.props.parse(screen.props)).not.toThrow()
            })

            it('les extraits de code référencés existent', () => {
              const props = screen.props as { files?: Array<{ source: string }> }
              for (const f of props.files ?? []) {
                expect(getCodeSource(f.source), f.source).toBeDefined()
              }
            })

            it('chaque pastille vise une zone qui existe sur l’écran', () => {
              const zones = new Set(screens[screen.component]!.zones(screen.props))
              for (const a of screen.annotations) expect(zones.has(a.zone), a.zone).toBe(true)
            })

            it('les identifiants de pastilles sont uniques', () => {
              const ids = screen.annotations.map((a) => a.id)
              expect(new Set(ids).size).toBe(ids.length)
            })
          })
        }
      })
    }
  })
}
