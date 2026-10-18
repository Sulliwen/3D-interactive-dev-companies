import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { CaptureView } from './ui/CaptureView'
import './ui/styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('Élément #root introuvable dans index.html')

// `?capture=8` : écran du poste 8 seul, pour générer son image (voir tools/capture-screens.mjs).
const capture = new URLSearchParams(window.location.search).get('capture')

createRoot(root).render(
  <StrictMode>{capture ? <CaptureView number={Number(capture)} /> : <App />}</StrictMode>,
)
