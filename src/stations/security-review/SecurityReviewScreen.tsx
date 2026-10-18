import { useEffect, useMemo, useState } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { StatusBadge } from '../common/charts'
import { highlightLines } from '../code-editor/highlight'
import type { ScreenComponentProps } from '../types'
import { securityReviewPropsSchema } from './schema'
import './security-review.css'

const STATE_LABEL = { done: 'Fait', 'in-progress': 'En cours', todo: 'À faire' } as const
const STATE_ICON = { done: '✓', 'in-progress': '…', todo: '○' } as const

/** Outil fictif « Lumen Shield » : revue de sécurité d'une fonctionnalité. */
export function SecurityReviewScreen({ toolName, props: rawProps }: ScreenComponentProps) {
  const props = useMemo(() => securityReviewPropsSchema.parse(rawProps), [rawProps])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  // En mode interactif, on peut appliquer la mise à jour des dépendances vulnérables.
  const [patched, setPatched] = useState(false)
  const code = useMemo(() => highlightLines(props.accessCheck.code), [props.accessCheck.code])

  // Toutes les zones sont toujours visibles.
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, zoneRevealed])

  const items = props.checklist.flatMap((g) => g.items)
  const done = items.filter((i) => i.state === 'done').length
  const vulnerable = props.dependencies.filter((d) => d.severity !== 'none' && !patched).length

  return (
    <AppWindow
      toolName={toolName}
      title="Revue de sécurité"
      status={
        <>
          <span>
            {done} / {items.length} contrôles validés
          </span>
          <span>
            {vulnerable === 0 ? '0 vulnérabilité' : `${vulnerable} vulnérabilité à corriger`}
          </span>
          <span className="sr__status-right">Hébergement certifié HDS</span>
        </>
      }
    >
      <div className="sr">
        <Zone id="security-header" className="sr__header">
          <p className="sr__feature">{props.feature}</p>
          <p className="sr__reviewer">
            Revue menée par <strong>{props.reviewer}</strong>
          </p>
          <span className="sr__verdict">
            {items.length - done > 0 || vulnerable > 0 ? (
              <StatusBadge status="warning">
                {plural(items.length - done + vulnerable, 'point')} à finir avant la mise en ligne
              </StatusBadge>
            ) : (
              <StatusBadge status="good">Feu vert sécurité</StatusBadge>
            )}
          </span>
        </Zone>

        <div className="sr__grid">
          <div className="sr__checklist">
            {props.checklist.map((group) => (
              <Zone key={group.zone} id={group.zone} className="sr__card">
                <p className="sr__card-title">{group.title}</p>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.label} className={`sr__item sr__item--${item.state}`}>
                      <span className="sr__check" aria-label={STATE_LABEL[item.state]}>
                        {STATE_ICON[item.state]}
                      </span>
                      <span>
                        {item.label}
                        {item.note && <span className="sr__note">{item.note}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </Zone>
            ))}
          </div>

          <div className="sr__right">
            <div className="sr__row">
              <Zone id="ownership" className="sr__card sr__access">
                <p className="sr__card-title">{props.accessCheck.title}</p>
                <p className="sr__source">{props.accessCheck.source}</p>
                <pre className="sr__code">
                  {code.map((line, i) => (
                    <code key={i}>
                      {line.map((t, k) => (
                        <span key={k} className={`tk-${t.kind}`}>
                          {t.text}
                        </span>
                      ))}
                      {'\n'}
                    </code>
                  ))}
                </pre>
                <p className="sr__result">
                  <StatusBadge status="good">Vérifié</StatusBadge> {props.accessCheck.result}
                </p>
              </Zone>

              <Zone id="dependencies" className="sr__card sr__deps">
                <p className="sr__card-title">Analyse des dépendances</p>
                <table>
                  <tbody>
                    {props.dependencies.map((dep) => {
                      const fixed = dep.severity !== 'none' && patched
                      return (
                        <tr key={dep.name}>
                          <td className="sr__dep-name">
                            {dep.name}
                            <span>{fixed ? dep.fixedIn : dep.version}</span>
                          </td>
                          <td>
                            {dep.severity === 'none' || fixed ? (
                              <StatusBadge status="good">{fixed ? 'Corrigée' : 'OK'}</StatusBadge>
                            ) : (
                              <StatusBadge
                                status={dep.severity === 'high' ? 'critical' : 'serious'}
                              >
                                Vulnérabilité {dep.severity === 'high' ? 'grave' : 'moyenne'}
                              </StatusBadge>
                            )}
                            <span className="sr__dep-note">
                              {fixed ? `Mise à jour vers ${dep.fixedIn} installée` : dep.note}
                            </span>
                            {dep.severity !== 'none' && !fixed && live && dep.fixedIn && (
                              <button
                                type="button"
                                className="sr__patch"
                                onClick={() => setPatched(true)}
                              >
                                Mettre à jour vers {dep.fixedIn}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Zone>
            </div>

            <Zone id="audit-log" className="sr__card sr__log">
              <p className="sr__card-title">{props.auditTitle}</p>
              <table>
                <thead>
                  <tr>
                    <th>Heure</th>
                    <th>Événement</th>
                    <th>Qui</th>
                    <th>Quoi</th>
                    <th>Résultat</th>
                  </tr>
                </thead>
                <tbody>
                  {props.auditLog.map((row, i) => (
                    <tr key={i}>
                      <td>{row.time}</td>
                      <td>
                        <code>{row.event}</code>
                      </td>
                      <td>
                        <code>{row.actor}</code>
                      </td>
                      <td>
                        <code>{row.resource}</code>
                      </td>
                      <td>
                        {row.result === 'ok' ? (
                          <StatusBadge status="good">Autorisé</StatusBadge>
                        ) : (
                          <StatusBadge status="critical">Refusé</StatusBadge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Zone>
          </div>
        </div>
      </div>
    </AppWindow>
  )
}

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`
