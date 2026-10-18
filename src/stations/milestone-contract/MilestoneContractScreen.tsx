import { useEffect, useMemo, useState } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { StatusBadge } from '../common/charts'
import type { ScreenComponentProps } from '../types'
import { milestoneContractPropsSchema, type MilestoneContractProps } from './schema'
import './milestone-contract.css'

const euros = (n: number) =>
  n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const STATE = {
  paid: { status: 'good', label: 'Versé' },
  current: { status: 'warning', label: 'En jeu' },
  upcoming: { status: 'neutral', label: 'À venir' },
} as const

/** Suivi d'un contrat d'édition : jalons, versements, livrables, remboursement de l'avance. */
export function MilestoneContractScreen({ toolName, props: raw }: ScreenComponentProps) {
  const props = useMemo(() => milestoneContractPropsSchema.parse(raw), [raw])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  const [done, setDone] = useState(() => props.deliverables.map((d) => d.done))
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const total = props.payments.reduce((n, p) => n + p.amount, 0)
  const paid = props.payments.filter((p) => p.state === 'paid').reduce((n, p) => n + p.amount, 0)
  const ready = done.filter(Boolean).length

  return (
    <AppWindow
      toolName={toolName}
      title={props.contract}
      status={
        <>
          <span>
            {euros(paid)} versés sur {euros(total)}
          </span>
          <span style={{ marginLeft: 'auto' }}>{props.status}</span>
        </>
      }
    >
      <div className="mc">
        <div className="mc__left">
          <Zone id="payments" className="mc__panel mc__payments">
            <p className="mc__heading">Échéancier · un versement par jalon validé</p>
            <PaymentBar payments={props.payments} total={total} />
            <ol className="mc__rows">
              {props.payments.map((p) => (
                <li key={p.label} className={`mc__row mc__row--${p.state}`}>
                  <span className="mc__row-label">{p.label}</span>
                  <span className="mc__row-date">{p.date}</span>
                  <span className="mc__row-amount">{euros(p.amount)}</span>
                  <StatusBadge status={STATE[p.state].status}>{STATE[p.state].label}</StatusBadge>
                </li>
              ))}
            </ol>
          </Zone>

          <Zone id="recoup" className="mc__panel mc__recoup">
            <p className="mc__heading">L'avance, remboursée sur les ventes</p>
            <p className="mc__text">{props.recoup.text}</p>
            {props.recoup.shares.map((s) => (
              <div key={s.label} className="mc__share">
                <span className="mc__share-label">{s.label}</span>
                <span
                  className="mc__share-bar"
                  role="img"
                  aria-label={`Studio ${s.studio} %, éditeur ${100 - s.studio} %`}
                >
                  <span style={{ width: `${s.studio}%` }}>Studio {s.studio} %</span>
                  <span>Éditeur {100 - s.studio} %</span>
                </span>
              </div>
            ))}
          </Zone>
        </div>

        <div className="mc__right">
          <div className="mc__milestone">
            <p className="mc__kicker">Jalon en cours</p>
            <p className="mc__title">{props.milestone.title}</p>
            <p className="mc__muted">
              {props.milestone.when} · {props.milestone.contact}
            </p>
          </div>

          <Zone id="deliverables" className="mc__panel">
            <p className="mc__heading">
              Livrables · {ready} / {props.deliverables.length} prêts
            </p>
            <ul className="mc__checks">
              {props.deliverables.map((d, i) => (
                <li key={d.label}>
                  <label>
                    <input
                      type="checkbox"
                      checked={done[i]}
                      disabled={!live}
                      tabIndex={live ? 0 : -1}
                      onChange={() => setDone((v) => v.map((x, j) => (j === i ? !x : x)))}
                    />
                    <span>{d.label}</span>
                    <em>{d.owner}</em>
                  </label>
                </li>
              ))}
            </ul>
          </Zone>

          <Zone id="criteria" className="mc__panel">
            <p className="mc__heading">Critères d'acceptation (article 4.2)</p>
            <ul className="mc__criteria">
              {props.criteria.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Zone>

          <Zone id="next" className="mc__panel mc__next">
            <p className="mc__heading">Ensuite · {props.next.when}</p>
            <p className="mc__next-title">{props.next.title}</p>
            <p className="mc__text">{props.next.text}</p>
          </Zone>
        </div>
      </div>
    </AppWindow>
  )
}

function PaymentBar({
  payments,
  total,
}: {
  payments: MilestoneContractProps['payments']
  total: number
}) {
  return (
    <div
      className="mc__bar"
      role="img"
      aria-label={payments.map((p) => `${p.label} : ${euros(p.amount)}`).join(', ')}
    >
      {payments.map((p) => (
        <span
          key={p.label}
          className={`mc__seg mc__seg--${p.state}`}
          style={{ flexGrow: p.amount / total }}
        />
      ))}
    </div>
  )
}
