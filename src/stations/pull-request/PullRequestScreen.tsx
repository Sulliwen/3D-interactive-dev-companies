import { useEffect, useMemo, useState } from 'react'
import { AppWindow } from '../common/AppWindow'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { Icon } from '../common/icons'
import { StatusBadge } from '../common/charts'
import { highlightLines, type Token } from '../code-editor/highlight'
import type { ScreenComponentProps } from '../types'
import {
  CONVERSATION_TAB_ZONES,
  FILES_TAB_ZONES,
  pullRequestPropsSchema,
  type PullRequestProps,
} from './schema'
import './pull-request.css'

type Tab = 'conversation' | 'files'

/** Outil fictif « Lumen Git » : une pull request en cours de relecture. */
export function PullRequestScreen({ toolName, props: rawProps }: ScreenComponentProps) {
  const pr = useMemo(() => pullRequestPropsSchema.parse(rawProps), [rawProps])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  const [tab, setTab] = useState<Tab>('files')
  const [merged, setMerged] = useState(false)
  const tabIndex = live ? 0 : -1

  // Une bulle vise une zone d'un autre onglet : on change d'onglet pendant le rendu…
  const [handledZone, setHandledZone] = useState<string | null>(null)
  if (revealZone !== handledZone) {
    setHandledZone(revealZone)
    if (revealZone && FILES_TAB_ZONES.includes(revealZone)) setTab('files')
    if (revealZone && CONVERSATION_TAB_ZONES.includes(revealZone)) setTab('conversation')
  }
  // … puis on signale que la zone est visible.
  useEffect(() => {
    if (revealZone) zoneRevealed()
  }, [revealZone, tab, zoneRevealed])

  const additions = pr.changedFiles.reduce((sum, f) => sum + f.additions, 0)
  const deletions = pr.changedFiles.reduce((sum, f) => sum + f.deletions, 0)
  const approved = pr.reviewers.every((r) => r.state === 'approved')

  return (
    <AppWindow
      toolName={toolName}
      title={`Pull request #${pr.number}`}
      status={
        <>
          <span>
            <Icon name="branch" size={13} /> {pr.branch} → {pr.base}
          </span>
          <span>
            {pr.commits} commits · {pr.changedFiles.length} fichiers
          </span>
          <span className="pr__status-right">pocket-sante</span>
        </>
      }
    >
      <div className="pr">
        <div className="pr__main">
          <Zone id="pr-header" className="pr__header">
            <p className="pr__title">
              {pr.title} <span>#{pr.number}</span>
            </p>
            <p className="pr__meta">
              <span className={`pr__state ${merged ? 'pr__state--merged' : ''}`}>
                {merged ? '✓ Fusionnée' : '● Ouverte'}
              </span>
              <strong>{pr.authors.join(' et ')}</strong> veulent intégrer {pr.commits} commits de{' '}
              <code>{pr.branch}</code> dans <code>{pr.base}</code>
            </p>
          </Zone>

          <div className="pr__tabs" role="tablist" aria-label="Vues de la pull request">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'conversation'}
              tabIndex={tabIndex}
              className={tab === 'conversation' ? 'is-active' : ''}
              onClick={() => setTab('conversation')}
            >
              Conversation <span>{pr.timeline.length + countInline(pr)}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'files'}
              tabIndex={tabIndex}
              className={tab === 'files' ? 'is-active' : ''}
              onClick={() => setTab('files')}
            >
              Fichiers modifiés <span>{pr.changedFiles.length}</span>
            </button>
            <span
              className="pr__counts"
              aria-label={`${additions} lignes ajoutées, ${deletions} supprimées`}
            >
              <span className="pr__plus">+{additions}</span>{' '}
              <span className="pr__minus">−{deletions}</span>
            </span>
          </div>

          <div className="pr__panel" role="tabpanel" tabIndex={tabIndex}>
            {tab === 'files' ? <FilesTab pr={pr} /> : <ConversationTab pr={pr} />}
          </div>
        </div>

        <aside className="pr__side">
          <Zone id="approval" className="pr__box">
            <p className="pr__box-title">Relecteurs</p>
            {pr.reviewers.map((r) => (
              <p key={r.name} className="pr__reviewer">
                <span className="pr__avatar" aria-hidden="true">
                  {initials(r.name)}
                </span>
                {r.name}
                <span className="pr__reviewer-state">
                  {r.state === 'approved' && <StatusBadge status="good">Approuvé</StatusBadge>}
                  {r.state === 'pending' && <StatusBadge status="neutral">En attente</StatusBadge>}
                  {r.state === 'changes' && (
                    <StatusBadge status="serious">Modifications demandées</StatusBadge>
                  )}
                </span>
              </p>
            ))}
          </Zone>

          <Zone id="checks" className="pr__box">
            <p className="pr__box-title">Vérifications automatiques</p>
            {pr.checks.map((c) => (
              <p key={c.label} className="pr__check">
                <span className="pr__check-icon" aria-hidden="true">
                  <Icon name="check" size={13} />
                </span>
                <span>
                  {c.label}
                  <span className="pr__check-detail">{c.detail}</span>
                </span>
              </p>
            ))}
          </Zone>

          <div className="pr__box pr__merge">
            {merged ? (
              <p className="pr__merged" role="status">
                {pr.mergedMessage}
              </p>
            ) : (
              <>
                <p className="pr__merge-ready">
                  {approved ? '✓ Prête à être fusionnée' : 'En attente de relecture'}
                </p>
                <button
                  type="button"
                  className="pr__merge-btn"
                  tabIndex={tabIndex}
                  disabled={!approved}
                  onClick={live ? () => setMerged(true) : undefined}
                >
                  Fusionner dans {pr.base}
                </button>
              </>
            )}
          </div>
        </aside>
      </div>
    </AppWindow>
  )
}

function FilesTab({ pr }: { pr: PullRequestProps }) {
  return (
    <>
      <Zone id="changed-files" className="pr__files">
        {pr.changedFiles.map((f) => (
          <p key={f.path} className="pr__file">
            <span>{f.path}</span>
            <span className="pr__plus">+{f.additions}</span>
            <span className="pr__minus">−{f.deletions}</span>
          </p>
        ))}
      </Zone>
      {pr.diffs.map((d, i) => (
        <Diff key={d.path} diff={d} zone={i === 0 ? 'diff' : undefined} />
      ))}
    </>
  )
}

function Diff({ diff, zone }: { diff: PullRequestProps['diffs'][number]; zone?: string }) {
  const tokens = useMemo(() => highlightLines(diff.lines.map((l) => l.text)), [diff.lines])
  const comment = diff.inlineComment

  const lines = diff.lines.map((line, i) => (
    <div key={i}>
      <div className={`pr__line pr__line--${kind(line.t)}`}>
        <span className="pr__ln">{line.n ?? ''}</span>
        <span className="pr__sign" aria-label={label(line.t)}>
          {line.t === '-' ? '−' : line.t}
        </span>
        <code>
          {tokens[i]!.map((t: Token, k) => (
            <span key={k} className={`tk-${t.kind}`}>
              {t.text}
            </span>
          ))}
        </code>
      </div>
      {comment && comment.after === i && (
        <Zone id="inline-comment" className="pr__inline">
          {comment.thread.map((c, k) => (
            <div key={k} className="pr__comment">
              <p className="pr__comment-head">
                <span className="pr__avatar" aria-hidden="true">
                  {initials(c.author)}
                </span>
                <strong>{c.author}</strong> <span>{c.when}</span>
              </p>
              <p>{c.text}</p>
              {k === 0 && comment.suggestion && (
                <div className="pr__suggestion">
                  <p className="pr__suggestion-title">Suggestion de modification</p>
                  <p className="pr__line pr__line--del">
                    <span className="pr__sign" aria-label="ligne supprimée">
                      −
                    </span>
                    <code>{comment.suggestion.from}</code>
                  </p>
                  <p className="pr__line pr__line--add">
                    <span className="pr__sign" aria-label="ligne ajoutée">
                      +
                    </span>
                    <code>{comment.suggestion.to}</code>
                  </p>
                </div>
              )}
            </div>
          ))}
          {comment.resolved && <p className="pr__resolved">✓ Discussion résolue</p>}
        </Zone>
      )}
    </div>
  ))

  return (
    <div className="pr__diff">
      <p className="pr__diff-path">
        {diff.path} <span>{diff.hunk}</span>
      </p>
      {zone ? <Zone id={zone}>{lines}</Zone> : lines}
    </div>
  )
}

function ConversationTab({ pr }: { pr: PullRequestProps }) {
  return (
    <>
      <Zone id="description" className="pr__comment pr__comment--first">
        <p className="pr__comment-head">
          <span className="pr__avatar" aria-hidden="true">
            {initials(pr.authors[0]!)}
          </span>
          <strong>{pr.authors[0]}</strong> <span>a ouvert la pull request</span>
        </p>
        <p>{pr.description}</p>
      </Zone>
      <Zone id="timeline" className="pr__timeline">
        {pr.timeline.map((c, i) => (
          <div key={i} className="pr__comment">
            <p className="pr__comment-head">
              <span className="pr__avatar" aria-hidden="true">
                {initials(c.author)}
              </span>
              <strong>{c.author}</strong> <span>{c.when}</span>
            </p>
            <p>{c.text}</p>
          </div>
        ))}
      </Zone>
    </>
  )
}

const kind = (t: '+' | '-' | ' ') => (t === '+' ? 'add' : t === '-' ? 'del' : 'ctx')
const label = (t: '+' | '-' | ' ') =>
  t === '+' ? 'ligne ajoutée' : t === '-' ? 'ligne supprimée' : 'ligne inchangée'
const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
const countInline = (pr: PullRequestProps) =>
  pr.diffs.reduce((sum, d) => sum + (d.inlineComment?.thread.length ?? 0), 0)
