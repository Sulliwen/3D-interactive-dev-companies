import { useState } from 'react'
import './common.css'

/**
 * L'écran d'annulation de l'application Pocket Santé, dans un téléphone.
 * Partagé par le Design (maquette, prototype), le front-end (simulateur) et la QA.
 *
 * - `appointments` : liste « Mes rendez-vous » avec le bouton Annuler ;
 * - `confirm` : demande de confirmation ;
 * - `cancelled` : annulation réussie, créneau libéré ;
 * - `too-late` : refus, rendez-vous dans moins de 24 h.
 */
export type PhoneState = 'appointments' | 'confirm' | 'cancelled' | 'too-late'

export function PocketSantePhone({
  state: initial = 'appointments',
  interactive = false,
  width = 210,
  /** Rendez-vous affiché (date lisible). */
  when = 'Lun. 18 nov. · 10:30',
  /** Ce que donne « Oui, annuler » dans le prototype. */
  outcome = 'cancelled',
  /** Libellé sous le téléphone (ex. « Écran 2 — Confirmation »). */
  caption,
}: {
  state?: PhoneState
  interactive?: boolean
  width?: number
  when?: string
  outcome?: 'cancelled' | 'too-late'
  caption?: string
}) {
  const [state, setState] = useState<PhoneState>(initial)
  const go = (next: PhoneState) => (interactive ? () => setState(next) : undefined)
  const tab = interactive ? 0 : -1

  return (
    <figure className="phone" style={{ width, fontSize: width / 19 }}>
      <div className="phone__device">
        <div className="phone__notch" aria-hidden="true" />
        <div className="phone__screen">
          <div className="phone__statusbar" aria-hidden="true">
            <span>9:41</span>
            <span>●●● ▮</span>
          </div>
          <div className="phone__appbar">
            <span className="phone__logo" aria-hidden="true">
              +
            </span>
            Mes rendez-vous
          </div>

          <div className="phone__content">
            <div className={`phone__card ${state === 'cancelled' ? 'phone__card--cancelled' : ''}`}>
              <p className="phone__doctor">Dr Élise Martin</p>
              <p className="phone__muted">Médecin généraliste</p>
              <p className="phone__when">{when}</p>
              <p className="phone__muted">Cabinet des Lilas, Lyon 3e</p>
              {state === 'cancelled' ? (
                <p className="phone__badge">Annulé</p>
              ) : (
                <div className="phone__actions">
                  <button type="button" className="phone__btn" tabIndex={tab}>
                    Déplacer
                  </button>
                  <button
                    type="button"
                    className="phone__btn phone__btn--danger"
                    tabIndex={tab}
                    onClick={go('confirm')}
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
            <div className="phone__card phone__card--ghost">
              <p className="phone__doctor">Dr Karim Benali</p>
              <p className="phone__muted">Dermatologue</p>
              <p className="phone__when">Mar. 3 déc. · 16:00</p>
            </div>
          </div>

          {state === 'confirm' && (
            <div className="phone__sheet" role="dialog" aria-label="Confirmer l'annulation">
              <p className="phone__sheet-title">Annuler ce rendez-vous ?</p>
              <p className="phone__muted">
                Le créneau sera proposé tout de suite aux patients en liste d'attente.
              </p>
              <button
                type="button"
                className="phone__btn phone__btn--danger phone__btn--block"
                tabIndex={tab}
                onClick={go(outcome)}
              >
                Oui, annuler
              </button>
              <button
                type="button"
                className="phone__btn phone__btn--block"
                tabIndex={tab}
                onClick={go('appointments')}
              >
                Garder mon rendez-vous
              </button>
            </div>
          )}

          {state === 'cancelled' && (
            <div className="phone__toast phone__toast--good" role="status">
              ✓ Rendez-vous annulé. Merci, le créneau a été libéré.
            </div>
          )}

          {state === 'too-late' && (
            <div className="phone__sheet" role="alertdialog" aria-label="Annulation impossible">
              <p className="phone__sheet-title">Annulation impossible en ligne</p>
              <p className="phone__muted">
                Ce rendez-vous a lieu dans moins de 24 h. Pour l'annuler, appelez le cabinet.
              </p>
              <p className="phone__call">☎ 04 72 00 00 00</p>
              <button
                type="button"
                className="phone__btn phone__btn--block"
                tabIndex={tab}
                onClick={go('appointments')}
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
      {interactive && state !== initial && (
        <button type="button" className="phone__reset" onClick={() => setState(initial)}>
          ↺ Recommencer
        </button>
      )}
      {caption && <figcaption className="phone__caption">{caption}</figcaption>}
    </figure>
  )
}
