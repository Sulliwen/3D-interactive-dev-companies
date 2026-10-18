import { useEffect, useRef } from 'react'

/**
 * Échap ferme d'abord ce qui a été ouvert en dernier : définition du glossaire,
 * puis bulle d'explication, puis panneau, puis le zoom sur l'écran.
 */
const stack: Array<{ current: () => void }> = []

function onKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  const top = stack[stack.length - 1]
  if (!top) return
  e.preventDefault()
  e.stopImmediatePropagation()
  top.current()
}

export function useEscape(handler: () => void, active = true): void {
  const ref = useRef(handler)
  useEffect(() => {
    ref.current = handler
  })

  useEffect(() => {
    if (!active) return
    if (stack.length === 0) window.addEventListener('keydown', onKeyDown, true)
    stack.push(ref)
    return () => {
      const i = stack.lastIndexOf(ref)
      if (i !== -1) stack.splice(i, 1)
      if (stack.length === 0) window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [active])
}
