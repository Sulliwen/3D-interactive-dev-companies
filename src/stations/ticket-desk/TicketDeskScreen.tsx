import { useEffect, useMemo, useState } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { StatusBadge } from '../common/charts'
import type { ScreenComponentProps } from '../types'
import { ticketDeskPropsSchema } from './schema'
import './ticket-desk.css'

/** Outil de support fictif « Lumen Desk » : boîte de réception, conversation, fiche patient. */
export function TicketDeskScreen({ toolName, props: rawProps }: ScreenComponentProps) {
  const props = useMemo(() => ticketDeskPropsSchema.parse(rawProps), [rawProps])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  // Vue figée (image de loin) : la remontée au produit est déjà faite.
  const [escalated, setEscalated] = useState(!live)
  const tab = live ? 0 : -1

  // Tout est visible d'emblée : rien à faire défiler pour montrer une zone.
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const max = Math.max(...props.reasons.items.map((r) => r.count))
  const { ticket } = props

  return (
    <AppWindow
      toolName={toolName}
      title={`Ticket #${ticket.id}`}
      titleRight="Lucie M. · Support"
      status={
        <>
          <span>File : {props.status.queue}</span>
          <span>Délai moyen de première réponse : {props.status.firstReply}</span>
          <span className="td__status-right">Satisfaction : {props.status.satisfaction}</span>
        </>
      }
    >
      <Zone id="inbox" className="td__inbox">
        <div className="td__filters">
          {props.filters.map((f, i) => (
            <span key={f.label} className={`td__filter ${i === 0 ? 'td__filter--active' : ''}`}>
              {f.label} <b>{f.count}</b>
            </span>
          ))}
        </div>
        <ul className="td__list">
          {props.inbox.map((t) => (
            <li
              key={t.id}
              className={`td__item ${t.id === ticket.id ? 'td__item--open' : ''} ${t.unread ? 'td__item--unread' : ''}`}
            >
              <span className="td__item-top">
                <span className="td__from">{t.from}</span>
                <span className="td__time">{t.time}</span>
              </span>
              <span className="td__subject">{t.subject}</span>
              <span className="td__item-bottom">
                <span className={`td__tag ${t.tag === 'Annulation' ? 'td__tag--focus' : ''}`}>
                  {t.tag}
                </span>
                <span className="td__id">#{t.id}</span>
              </span>
            </li>
          ))}
        </ul>
      </Zone>

      <div className="td__main">
        <div className="td__head">
          <p className="td__ticket-title">{ticket.subject}</p>
          <StatusBadge status={escalated ? 'good' : 'neutral'}>
            {escalated ? 'Répondu · remonté au produit' : 'En cours'}
          </StatusBadge>
        </div>

        <Zone id="conversation" className="td__thread">
          {ticket.messages
            .filter((m) => m.kind !== 'note')
            .map((m, i) => (
              <Message key={i} {...m} />
            ))}
        </Zone>
        <Zone id="note" className="td__notes">
          {ticket.messages
            .filter((m) => m.kind === 'note')
            .map((m, i) => (
              <Message key={i} {...m} />
            ))}
        </Zone>

        <div className="td__reply" aria-hidden="true">
          <span className="td__reply-label">Réponse type</span> {ticket.reply}
        </div>
      </div>

      <aside className="td__side">
        <Zone id="tags" className="td__card">
          <p className="td__card-title">{props.customer.kind}</p>
          <p className="td__customer">{props.customer.name}</p>
          <dl className="td__details">
            {props.customer.details.map((d) => (
              <div key={d.label}>
                <dt>{d.label}</dt>
                <dd>{d.value}</dd>
              </div>
            ))}
          </dl>
          <p className="td__card-title">Motif</p>
          <p className="td__tags">
            {props.customer.tags.map((t) => (
              <span key={t} className={`td__tag ${t === 'Annulation' ? 'td__tag--focus' : ''}`}>
                {t}
              </span>
            ))}
          </p>
        </Zone>

        <Zone id="reasons" className="td__card">
          <p className="td__card-title">{props.reasons.title}</p>
          <ul className="td__reasons">
            {props.reasons.items.map((r, i) => (
              <li key={r.label}>
                <span className="td__reason-label">
                  {r.label}
                  <b>{r.count}</b>
                </span>
                <span className="td__bar">
                  <span
                    className={i === 0 ? 'td__bar-fill td__bar-fill--top' : 'td__bar-fill'}
                    style={{ width: `${(r.count / max) * 100}%` }}
                  />
                </span>
              </li>
            ))}
          </ul>
          <p className="td__reason-note">{props.reasons.note}</p>
        </Zone>

        <Zone id="escalation" className="td__card td__card--escalation">
          {escalated ? (
            <p className="td__escalated">
              <span aria-hidden="true">✓</span> {props.escalation.done}
            </p>
          ) : (
            <button
              type="button"
              className="td__escalate"
              tabIndex={tab}
              onClick={() => setEscalated(true)}
            >
              ↗ {props.escalation.action}
            </button>
          )}
        </Zone>
      </aside>
    </AppWindow>
  )
}

function Message({
  author,
  kind,
  time,
  text,
}: {
  author: string
  kind: 'patient' | 'agent' | 'note'
  time: string
  text: string
}) {
  return (
    <div className={`td__msg td__msg--${kind}`}>
      <p className="td__msg-head">
        <span className="td__avatar" aria-hidden="true">
          {author.charAt(0)}
        </span>
        <b>{author}</b>
        {kind === 'note' && (
          <span className="td__note-label">Note interne · invisible du patient</span>
        )}
        <span className="td__time">{time}</span>
      </p>
      <p className="td__msg-text">{text}</p>
    </div>
  )
}
