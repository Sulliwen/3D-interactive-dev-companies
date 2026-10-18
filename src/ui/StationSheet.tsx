import type { Station } from '../content/schema'
import {
  getGlossaryEntry,
  stationAtDesk,
  stationGlossaryIds,
  stationLabel,
} from '../content/loader'
import { useGameStore } from '../state/useGameStore'
import { useVisit } from '../state/visit'
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
  const visit = useVisit()
  const screen = station.screen
  const bystander = station.status === 'bystander'

  const stationLinks = (numbers: number[]) => (
    <span className="sheet__links">
      {numbers.map((n) => {
        const s = stationAtDesk(visit, n)
        const label = s ? stationLabel(s) : 'Poste'
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
    <article
      className={`sheet ${bystander ? 'sheet--bystander' : ''}`}
      aria-labelledby={`sheet-title-${station.desk}`}
    >
      <header className="sheet__header">
        <p className="sheet__kicker">
          {station.status === 'bonus'
            ? 'Poste bonus · hors du parcours'
            : station.absent
              ? `Pas encore là · ${visit.scenario.title}`
              : bystander
                ? `Hors de ce scénario · ${visit.scenario.title}`
                : `Étape ${station.step} sur ${visit.pathStations.length} · ${visit.scenario.title}`}
        </p>
        <h2 id={`sheet-title-${station.desk}`} tabIndex={-1} data-autofocus>
          {station.title}
        </h2>
        <p className="sheet__person">
          {station.person.firstName} {station.person.lastName} · {station.person.role}
        </p>
      </header>

      <p className="sheet__tagline">
        <RichText text={station.tagline} />
      </p>

      <section
        className="sheet__feature"
        aria-label={bystander ? 'Pendant ce scénario' : 'Le travail suivi, à cette étape'}
      >
        <p className="sheet__label">
          {station.status === 'bonus'
            ? 'Pendant ce temps, autour du projet'
            : station.absent
              ? `Bureau vide : ${station.person.firstName} n'est pas encore là`
              : bystander
                ? "Dans ce scénario, ce poste n'intervient pas"
                : visit.scenario.workItem.label}
        </p>
        <p className="sheet__step">
          <RichText text={station.featureStep} />
        </p>
        {station.receivesFrom && station.handsOffTo && (
          <dl className="sheet__flow">
            <dt>Reçu de</dt>
            <dd>
              {stationLinks(station.receivesFrom.stations)}
              <RichText text={station.receivesFrom.text} />
            </dd>
            <dt>Transmis à</dt>
            <dd>
              {stationLinks(station.handsOffTo.stations)}
              <RichText text={station.handsOffTo.text} />
            </dd>
          </dl>
        )}
      </section>

      {screen && (
        <section>
          <h3>{bystander ? "Sur l'écran, son travail du moment" : "Sur l'écran"}</h3>
          <ol className="sheet__annotations">
            {screen.annotations.map((a, i) => (
              <li key={a.id}>
                <button type="button" onClick={() => requestAnnotation(a.id)}>
                  <span className="sheet__num">{i + 1}</span> {a.title}
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <h3>Ce que je fais</h3>
        <ul>
          {station.missions.map((m, i) => (
            <li key={i}>
              <RichText text={m} />
            </li>
          ))}
        </ul>
      </section>

      {station.takeaways && (
        <section className="sheet__takeaways">
          <h3>Ce qu'il faut retenir</h3>
          <ol>
            {station.takeaways.map((t, i) => (
              <li key={i}>
                <RichText text={t} />
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="sheet__myth">
        <h3>Idée reçue / réalité</h3>
        <p className="sheet__myth-false">
          <span>Idée reçue</span>
          <RichText text={station.myth.myth} />
        </p>
        <p className="sheet__myth-true">
          <span>En réalité</span>
          <RichText text={station.myth.reality} />
        </p>
      </section>

      <section>
        <h3>Les vrais outils du métier</h3>
        {screen && (
          <p className="sheet__hint">
            L'écran montre « {screen.toolName} », un outil imaginaire. Dans les entreprises, on
            utilise par exemple :
          </p>
        )}
        <p className="sheet__links">
          {station.realTools.map((t) => (
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
    </article>
  )
}
