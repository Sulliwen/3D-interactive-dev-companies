/**
 * Lecture du clavier par *position physique* de touche (`KeyboardEvent.code`).
 * La touche en haut à gauche des flèches « lettres » vaut toujours `KeyW`,
 * qu'elle porte un Z (AZERTY) ou un W (QWERTY) : ZQSD et WASD marchent donc
 * sans aucun réglage.
 */

const pressed = new Set<string>()

const FORWARD = ['KeyW', 'ArrowUp']
const BACKWARD = ['KeyS', 'ArrowDown']
const LEFT = ['KeyA']
const RIGHT = ['KeyD']
const TURN_LEFT = ['ArrowLeft']
const TURN_RIGHT = ['ArrowRight']
const RUN = ['ShiftLeft', 'ShiftRight']
const HANDLED = new Set([...FORWARD, ...BACKWARD, ...LEFT, ...RIGHT, ...TURN_LEFT, ...TURN_RIGHT])

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

export function attachKeyboard(): () => void {
  const down = (e: KeyboardEvent) => {
    if (isTypingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return
    pressed.add(e.code)
    // Les flèches ne doivent pas faire défiler la page… sauf dans un élément
    // d'interface qui a le focus (liste, code d'un écran simulé).
    const onPage = e.target === document.body || e.target instanceof HTMLCanvasElement
    if (onPage && HANDLED.has(e.code) && e.code.startsWith('Arrow')) e.preventDefault()
  }
  const up = (e: KeyboardEvent) => pressed.delete(e.code)
  const clear = () => pressed.clear()

  window.addEventListener('keydown', down)
  window.addEventListener('keyup', up)
  window.addEventListener('blur', clear)
  return () => {
    window.removeEventListener('keydown', down)
    window.removeEventListener('keyup', up)
    window.removeEventListener('blur', clear)
    pressed.clear()
  }
}

const any = (codes: readonly string[]) => codes.some((c) => pressed.has(c))

export interface MoveInput {
  /** -1 (gauche) à 1 (droite), relatif à la caméra. */
  x: number
  /** -1 (reculer) à 1 (avancer), relatif à la caméra. */
  forward: number
  /** -1 à 1 : rotation de la caméra aux flèches gauche / droite. */
  turn: number
  run: boolean
}

export function readMoveInput(): MoveInput {
  return {
    x: (any(RIGHT) ? 1 : 0) - (any(LEFT) ? 1 : 0),
    forward: (any(FORWARD) ? 1 : 0) - (any(BACKWARD) ? 1 : 0),
    turn: (any(TURN_RIGHT) ? 1 : 0) - (any(TURN_LEFT) ? 1 : 0),
    run: any(RUN),
  }
}

/**
 * Lettres à afficher dans l'aide (« ZQSD » ou « WASD »), d'après la disposition
 * réelle du clavier quand le navigateur sait la donner, sinon d'après la langue.
 */
export async function movementKeyLabels(): Promise<string> {
  const codes = ['KeyW', 'KeyA', 'KeyS', 'KeyD']
  try {
    const nav = navigator as Navigator & {
      keyboard?: { getLayoutMap(): Promise<Map<string, string>> }
    }
    const map = await nav.keyboard?.getLayoutMap()
    if (map) {
      const letters = codes.map((c) => map.get(c)?.toUpperCase() ?? '')
      if (letters.every((l) => l.length === 1)) return letters.join('')
    }
  } catch {
    // Pas d'accès à la disposition : on se rabat sur la langue.
  }
  return navigator.language.toLowerCase().startsWith('fr') ? 'ZQSD' : 'WASD'
}
