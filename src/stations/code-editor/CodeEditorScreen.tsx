import { useEffect, useMemo, useRef, useState } from 'react'
import { getCodeSource } from '../../content/loader'
import type { ParsedCode } from '../../content/codeSource'
import { useGameStore } from '../../state/useGameStore'
import { useAnnotations } from '../common/annotationContext'
import { Zone } from '../common/annotations'
import { Icon } from '../common/icons'
import { PocketSantePhone } from '../common/PocketSantePhone'
import { highlightLines, type Token } from './highlight'
import { codeEditorPropsSchema } from './schema'
import type { ScreenComponentProps } from '../types'
import './code-editor-preview.css'

const LINE_HEIGHT = 19

/** Éditeur de code fictif « Atelier Code », inspiré des éditeurs du marché. */
export function CodeEditorScreen({ toolName, props: rawProps }: ScreenComponentProps) {
  const props = useMemo(() => codeEditorPropsSchema.parse(rawProps), [rawProps])
  const { live, revealZone, zoneRevealed } = useAnnotations()
  const files = useMemo(
    () =>
      props.files.map((f) => ({
        name: f.name,
        code: getCodeSource(f.source) ?? {
          lines: [`// Fichier introuvable : ${f.source}`],
          zones: [],
        },
      })),
    [props.files],
  )
  const [active, setActive] = useState(Math.min(props.initialFile, files.length - 1))
  const editor = useRef<HTMLDivElement>(null)
  const file = files[active]!

  // Une bulle demande une zone : ouvrir le fichier qui la contient (pendant le rendu,
  // pour éviter un rendu intermédiaire sur le mauvais fichier)…
  const [handledZone, setHandledZone] = useState<string | null>(null)
  if (revealZone !== handledZone) {
    setHandledZone(revealZone)
    const index = files.findIndex((f) => f.code.zones.some((z) => z.id === revealZone))
    if (index !== -1 && index !== active) setActive(index)
  }

  // … puis faire défiler jusqu'à elle.
  useEffect(() => {
    if (!revealZone) return
    const zone = files[active]!.code.zones.find((z) => z.id === revealZone)
    if (zone && editor.current) {
      editor.current.scrollTop = Math.max(0, (zone.from - 2) * LINE_HEIGHT)
    }
    zoneRevealed()
  }, [revealZone, active, files, zoneRevealed])

  return (
    <div className={`ce ${props.preview ? 'ce--with-preview' : ''}`}>
      <div className="ce__titlebar">
        <span className="ce__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>
          {file.name} — {props.project} — {toolName}
        </span>
      </div>

      <div className="ce__body">
        <div className="ce__activity" aria-hidden="true">
          <span className="ce__icon ce__icon--active">
            <Icon name="files" size={20} />
          </span>
          <span className="ce__icon">
            <Icon name="search" size={20} />
          </span>
          <span className="ce__icon">
            <Icon name="branch" size={20} />
          </span>
          <span className="ce__icon">
            <Icon name="play" size={20} />
          </span>
        </div>

        <Zone id="explorer" className="ce__explorer">
          <p className="ce__section">Explorateur</p>
          <p className="ce__project">▾ {props.project}</p>
          {props.explorer
            .filter((p) => p.endsWith('/'))
            .map((p) => (
              <p key={p} className="ce__entry">
                ▸ {p.replace(/\/$/, '').split('/').pop()}
              </p>
            ))}
          <p className="ce__entry">▾ {props.folder}</p>
          {files.map((f, i) => (
            <button
              key={f.name}
              type="button"
              tabIndex={live ? 0 : -1}
              className={`ce__entry ce__entry--file ${i === active ? 'ce__entry--active' : ''}`}
              onClick={() => setActive(i)}
            >
              {f.name}
            </button>
          ))}
          {props.explorer
            .filter((p) => !p.endsWith('/'))
            .map((p) => (
              <p key={p} className="ce__entry ce__entry--root">
                {p}
              </p>
            ))}
        </Zone>

        <div className="ce__main">
          <Zone id="tabs" className="ce__tabs">
            <div role="tablist" aria-label="Fichiers ouverts">
              {files.map((f, i) => (
                <button
                  key={f.name}
                  type="button"
                  role="tab"
                  tabIndex={live ? 0 : -1}
                  aria-selected={i === active}
                  className={`ce__tab ${i === active ? 'ce__tab--active' : ''}`}
                  onClick={() => setActive(i)}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </Zone>

          <div
            ref={editor}
            className="ce__editor"
            role="tabpanel"
            aria-label={`Code de ${file.name}`}
            tabIndex={live ? 0 : -1}
          >
            <CodeView code={file.code} />
          </div>

          <Terminal
            project={props.project}
            command={props.terminal.command}
            lines={props.terminal.lines}
          />
        </div>

        {props.preview && (
          <Zone id="preview" className="ce__preview">
            <p className="ce__section">{props.preview.title}</p>
            <PocketSantePhone
              state={props.preview.state}
              outcome={props.preview.outcome}
              when={props.preview.when}
              caption={props.preview.caption}
              interactive={live}
              width={178}
            />
          </Zone>
        )}
      </div>

      <div className="ce__status">
        <span>
          <Icon name="branch" size={13} /> {props.branch}
        </span>
        <span>
          <Icon name="check" size={13} />{' '}
          {props.terminal.lines.filter((l) => l.kind === 'pass').length} tests
        </span>
        <span className="ce__status-right">TypeScript · UTF-8 · Espaces : 2</span>
      </div>
    </div>
  )
}

function CodeView({ code }: { code: ParsedCode }) {
  const tokens = useMemo(() => highlightLines(code.lines), [code])

  // Découpe en blocs : lignes libres et zones (pour poser les pastilles).
  const blocks: Array<{ zone: string | null; from: number; to: number }> = []
  let cursor = 0
  for (const z of [...code.zones].sort((a, b) => a.from - b.from)) {
    if (z.from > cursor) blocks.push({ zone: null, from: cursor, to: z.from - 1 })
    blocks.push({ zone: z.id, from: z.from, to: z.to })
    cursor = z.to + 1
  }
  if (cursor < code.lines.length)
    blocks.push({ zone: null, from: cursor, to: code.lines.length - 1 })

  const renderLines = (from: number, to: number) =>
    tokens
      .slice(from, to + 1)
      .map((line, k) => <CodeLine key={from + k} n={from + k + 1} tokens={line} />)

  return (
    <div className="ce__code">
      {blocks.map((b) =>
        b.zone ? (
          <Zone key={b.from} id={b.zone} className="ce__zone">
            {renderLines(b.from, b.to)}
          </Zone>
        ) : (
          <div key={b.from}>{renderLines(b.from, b.to)}</div>
        ),
      )}
    </div>
  )
}

function CodeLine({ n, tokens }: { n: number; tokens: Token[] }) {
  return (
    <div className="ce__line">
      <span className="ce__ln" aria-hidden="true">
        {n}
      </span>
      <code>
        {tokens.map((t, i) => (
          <span key={i} className={`tk-${t.kind}`}>
            {t.text}
          </span>
        ))}
      </code>
    </div>
  )
}

function Terminal({
  project,
  command,
  lines,
}: {
  project: string
  command: string
  lines: Array<{ kind: 'info' | 'pass' | 'fail' | 'summary'; text: string }>
}) {
  const { live } = useAnnotations()
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion)
  const animate = live && !reducedMotion
  const [shown, setShown] = useState(0)
  const [run, setRun] = useState(0)

  // Les tests « s'exécutent » ligne par ligne (tout d'un coup si les animations sont réduites).
  useEffect(() => {
    if (!animate) return
    let count = 0
    const id = window.setInterval(() => {
      count += 1
      setShown(count)
      if (count >= lines.length) window.clearInterval(id)
    }, 380)
    return () => window.clearInterval(id)
  }, [animate, lines.length, run])

  const visible = animate ? shown : lines.length
  const rerun = () => {
    setShown(0)
    setRun((r) => r + 1)
  }

  const running = visible < lines.length

  return (
    <Zone id="terminal" className="ce__terminal">
      <div className="ce__terminal-head">
        <span className="ce__terminal-tab">Terminal</span>
        {live && (
          <button type="button" className="ce__run" onClick={rerun} disabled={running}>
            ▶ Relancer les tests
          </button>
        )}
      </div>
      <div className="ce__terminal-body" aria-live="polite">
        <p className="ce__prompt">
          <span>~/{project} $</span> {command}
        </p>
        {lines.slice(0, visible).map((l, i) => (
          <p key={i} className={`ce__out ce__out--${l.kind}`}>
            {l.kind === 'pass' && <span className="ce__check">✓</span>}
            {l.kind === 'fail' && <span className="ce__cross">✗</span>}
            {l.text}
          </p>
        ))}
        {running && <p className="ce__cursor">▍</p>}
      </div>
    </Zone>
  )
}
