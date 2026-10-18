import { useGameStore } from '../state/useGameStore'
import { useVisit } from '../state/visit'
import { Dialog } from './Dialog'

/** Écran de fin : la chaîne complète, les résultats, et la suite. */
export function Finale() {
  const closeOverlay = useGameStore((s) => s.closeOverlay)
  const openCatalog = useGameStore((s) => s.openCatalog)
  const resetProgress = useGameStore((s) => s.resetProgress)
  const openMenu = useGameStore((s) => s.openMenu)
  const { scenario, pathStations } = useVisit()

  return (
    <Dialog
      title="Bravo, vous avez suivi toute la chaîne !"
      onClose={closeOverlay}
      className="dialog--wide finale"
      footer={
        <div className="finale__actions">
          <button type="button" className="button button--ghost" onClick={resetProgress}>
            Recommencer la visite
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => {
              closeOverlay()
              openMenu('pick')
            }}
          >
            Suivre un autre type de développement
          </button>
          <button type="button" className="button" onClick={closeOverlay} data-autofocus>
            Explorer librement
          </button>
        </div>
      }
    >
      <p className="finale__lead">
        « {scenario.workItem.title} » : {scenario.finale.lead}
      </p>

      <section aria-label="Résultats">
        <h3>{scenario.finale.outcomesTitle}</h3>
        <ul className="finale__outcomes">
          {scenario.finale.outcomes.map((o) => (
            <li key={o.label}>
              <span className="finale__label">{o.label}</span>
              <span className="finale__values">
                <span className="finale__before">{o.before}</span>
                <span aria-hidden="true">→</span>
                <span className="visually-hidden"> devenu </span>
                <strong>{o.after}</strong>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="La chaîne complète">
        <h3>La chaîne, poste par poste</h3>
        <ol className="finale__chain">
          {pathStations.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => openCatalog(s.desk)}>
                <span className="finale__num">{s.step}</span>
                <span className="finale__title">{s.title}</span>
                <span className="finale__step">{s.featureStep}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>
    </Dialog>
  )
}
