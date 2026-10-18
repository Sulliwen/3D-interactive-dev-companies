import type { Station } from '../content/schema'
import { getGlossaryEntry, getStationByNumber, stationGlossaryIds } from '../content/loader'
import { useGameStore } from '../state/useGameStore'
import { RichText } from './RichText'
import { Term } from './Term'

/**
 * Fiche d'un poste : affichée à côté de l'écran zoomé, et dans « Tous les postes ».
 * `onNavigate` rend les postes amont / aval cliquables (catalogue uniquement).
 */
export function StationSheet({
  station,
  onNavigate,
}: {
  station: Station
  onNavigate?: (n: number) => void
}) {
  const requestAnnotation = useGameStore((s) => s.requestAnnotation)
  const d = station.details

  const stationLinks = (numbers: number[]) => (
    <span className="sheet__links">
      {numbers.map((n) => {
        const s = getStationByNumber(n)
        const label = `${n}. ${s?.title ?? 'Poste'}`
        return onNavigate ? (
          <button key={n} type="button" className="chip chip--link" onClick={() => onNavigate(n)}>
            {label}
          </button>
        ) : (
          <span key={n} className="chip">
            {label}
          </span>
        )
      })}
    </span>
  )

  return (
    <article className="sheet" aria-labelledby={`sheet-title-${station.number}`}>
      <header className="sheet__header">
        <p className="sheet__kicker">
          {station.offPath
            ? 'Poste bonus · hors du fil rouge'
            : `Poste ${station.number} sur 14 · Pocket Santé`}
        </p>
        <h2 id={`sheet-title-${station.number}`} tabIndex={-1} data-autofocus>
          {station.title}
        </h2>
        {d && (
          <p className="sheet__person">
            {d.person.firstName} {d.person.lastName} · {d.person.role}
          </p>
        )}
      </header>

      {d && (
        <p className="sheet__tagline">
          <RichText text={d.tagline} />
        </p>
      )}

      <section className="sheet__feature" aria-label="La fonctionnalité à cette étape">
        <p className="sheet__label">
          {station.offPath
            ? 'Pendant ce temps, autour de la fonctionnalité'
            : 'La fonctionnalité « Annuler un rendez-vous », ici'}
        </p>
        <p className="sheet__step">{station.featureStep}</p>
        {d && (
          <dl className="sheet__flow">
            <dt>Elle arrive de</dt>
            <dd>
              {stationLinks(d.receivesFrom.stations)}
              <RichText text={d.receivesFrom.text} />
            </dd>
            <dt>Elle part vers</dt>
            <dd>
              {stationLinks(d.handsOffTo.stations)}
              <RichText text={d.handsOffTo.text} />
            </dd>
          </dl>
        )}
      </section>

      {!d && (
        <p className="sheet__soon">La fiche complète de ce poste est en cours de rédaction.</p>
      )}

      {d && (
        <>
          <section>
            <h3>Sur l'écran</h3>
            <ol className="sheet__annotations">
              {d.screen.annotations.map((a, i) => (
                <li key={a.id}>
                  <button type="button" onClick={() => requestAnnotation(a.id)}>
                    <span className="sheet__num">{i + 1}</span> {a.title}
                  </button>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3>Ce que je fais</h3>
            <ul>
              {d.missions.map((m, i) => (
                <li key={i}>
                  <RichText text={m} />
                </li>
              ))}
            </ul>
          </section>

          <section className="sheet__takeaways">
            <h3>Ce qu'il faut retenir</h3>
            <ol>
              {d.takeaways.map((t, i) => (
                <li key={i}>
                  <RichText text={t} />
                </li>
              ))}
            </ol>
          </section>

          <section className="sheet__myth">
            <h3>Idée reçue / réalité</h3>
            <p className="sheet__myth-false">
              <span>Idée reçue</span>
              <RichText text={d.myth.myth} />
            </p>
            <p className="sheet__myth-true">
              <span>En réalité</span>
              <RichText text={d.myth.reality} />
            </p>
          </section>

          <section>
            <h3>Les vrais outils du métier</h3>
            <p className="sheet__hint">
              L'écran montre « {d.screen.toolName} », un outil imaginaire. Dans les entreprises, on
              utilise par exemple :
            </p>
            <p className="sheet__links">
              {d.realTools.map((t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ))}
            </p>
          </section>

          <section>
            <h3>Mots de ce poste</h3>
            <p className="sheet__links">
              {stationGlossaryIds(station).map((id) => (
                <Term key={id} id={id}>
                  {getGlossaryEntry(id)?.term}
                </Term>
              ))}
            </p>
          </section>
        </>
      )}
    </article>
  )
}
