import { useMemo } from 'react'
import { parseRichText } from '../content/richText'
import { Term } from './Term'

/** Affiche un texte enrichi des fiches (termes du glossaire, gras, code). */
export function RichText({ text }: { text: string }) {
  const segments = useMemo(() => parseRichText(text), [text])
  return (
    <>
      {segments.map((s, i) => {
        switch (s.kind) {
          case 'text':
            return <span key={i}>{s.text}</span>
          case 'strong':
            return <strong key={i}>{s.text}</strong>
          case 'code':
            return (
              <code key={i} className="inline-code">
                {s.text}
              </code>
            )
          case 'term':
            return (
              <Term key={i} id={s.id}>
                {s.text ?? undefined}
              </Term>
            )
        }
      })}
    </>
  )
}
