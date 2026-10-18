import { describe, expect, it } from 'vitest'
import {
  ContentError,
  getCodeSource,
  getGlossaryEntry,
  glossary,
  parseStations,
  pathStations,
  stationGlossaryIds,
  stations,
} from './loader'
import { floorPlan } from '../engine/world/floorplan'
import { screens } from '../stations/registry'

const fiche = (number: number, id = `poste-${number}`) => ({
  id,
  number,
  title: 'Titre',
  featureStep: 'Étape',
})

describe('chargement du contenu', () => {
  it('charge les 14 postes du fil rouge, triés', () => {
    expect(pathStations.map((s) => s.number)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1))
  })

  it('les postes bonus sont hors du fil rouge', () => {
    expect(stations.filter((s) => s.offPath).map((s) => s.number)).toEqual([15])
  })

  it('chaque fiche a son poste dans le plan de l’étage', () => {
    const anchors = new Set(floorPlan.stations.map((a) => a.number))
    for (const s of stations) expect(anchors.has(s.number), `poste ${s.number}`).toBe(true)
  })

  it('trie les fiches par numéro', () => {
    const result = parseStations({ 'b.json': fiche(2), 'a.json': fiche(1) })
    expect(result.map((s) => s.number)).toEqual([1, 2])
  })

  it('signale le fichier fautif', () => {
    expect(() => parseStations({ 'stations/08-backend.json': { id: 'Back End' } })).toThrow(
      /08-backend\.json/,
    )
  })

  it('refuse deux fiches avec le même numéro ou le même identifiant', () => {
    expect(() => parseStations({ 'a.json': fiche(1), 'b.json': fiche(1) })).toThrow(ContentError)
    expect(() => parseStations({ 'a.json': fiche(1, 'x'), 'b.json': fiche(2, 'x') })).toThrow(
      /double/,
    )
  })
})

describe('cohérence des fiches rédigées', () => {
  const detailed = stations.filter((s) => s.details)

  it('tous les postes sont rédigés (fiche, écran, pastilles)', () => {
    expect(stations.filter((s) => !s.details).map((s) => s.number)).toEqual([])
  })

  it('chaque poste a son image vue de loin (npm run screens:capture)', () => {
    const images = Object.keys(import.meta.glob('../assets/screens/station-*.jpg'))
    for (const s of stations) {
      expect(images, `poste ${s.number}`).toContain(
        `../assets/screens/station-${String(s.number).padStart(2, '0')}.jpg`,
      )
    }
  })

  it('le glossaire n’a pas de doublon', () => {
    expect(new Set(glossary.map((g) => g.id)).size).toBe(glossary.length)
  })

  for (const station of detailed) {
    const d = station.details!
    describe(`poste ${station.number} · ${station.id}`, () => {
      it('chaque terme cité existe dans le glossaire', () => {
        const missing = stationGlossaryIds(station).filter((id) => !getGlossaryEntry(id))
        expect(missing).toEqual([])
      })

      it('les postes cités en amont et en aval existent', () => {
        const numbers = new Set(stations.map((s) => s.number))
        for (const n of [...d.receivesFrom.stations, ...d.handsOffTo.stations]) {
          expect(numbers.has(n), `poste ${n}`).toBe(true)
        }
      })

      it('l’écran simulé existe et ses données sont valides', () => {
        const schema = screens[d.screen.component]
        expect(schema, d.screen.component).toBeDefined()
        expect(() => schema!.props.parse(d.screen.props)).not.toThrow()
      })

      it('les extraits de code référencés existent', () => {
        const props = d.screen.props as { files?: Array<{ source: string }> }
        for (const f of props.files ?? []) expect(getCodeSource(f.source), f.source).toBeDefined()
      })

      it('chaque pastille vise une zone qui existe sur l’écran', () => {
        const zones = new Set(screens[d.screen.component]!.zones(d.screen.props))
        for (const a of d.screen.annotations) expect(zones.has(a.zone), a.zone).toBe(true)
      })

      it('les identifiants de pastilles sont uniques', () => {
        const ids = d.screen.annotations.map((a) => a.id)
        expect(new Set(ids).size).toBe(ids.length)
      })
    })
  }
})
