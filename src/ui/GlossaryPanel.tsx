import { useEffect, useMemo, useRef, useState } from 'react'
import { glossary } from '../content/loader'
import { useGameStore } from '../state/useGameStore'
import { Dialog } from './Dialog'

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function GlossaryPanel() {
  const focus = useGameStore((s) => s.glossaryFocus)
  const closeOverlay = useGameStore((s) => s.closeOverlay)
  const [query, setQuery] = useState('')
  const list = useRef<HTMLDListElement>(null)

  const entries = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return glossary
    return glossary.filter((g) => normalize(`${g.term} ${g.definition}`).includes(q))
  }, [query])

  useEffect(() => {
    if (focus)
      list.current?.querySelector(`#glossaire-${focus}`)?.scrollIntoView({ block: 'center' })
  }, [focus])

  return (
    <Dialog title="Glossaire" onClose={closeOverlay}>
      <label className="glossary__search">
        Rechercher un mot
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ex. : API, test, sprint…"
          data-autofocus
        />
      </label>
      <dl ref={list} className="glossary">
        {entries.map((g) => (
          <div key={g.id} id={`glossaire-${g.id}`} className={g.id === focus ? 'is-focus' : ''}>
            <dt>{g.term}</dt>
            <dd>
              {g.definition}
              {g.analogy && (
                <span className="glossary__analogy">
                  <span>Pour faire simple :</span> {g.analogy}
                </span>
              )}
            </dd>
          </div>
        ))}
        {entries.length === 0 && <p>Aucun mot ne correspond à « {query} ».</p>}
      </dl>
    </Dialog>
  )
}
