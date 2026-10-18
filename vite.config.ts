/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base: './'` : le build fonctionne aussi bien sur GitHub Pages (sous-dossier)
// que sur Netlify ou un intranet, sans configuration.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // Le moteur physique Rapier (WASM intégré) pèse à lui seul ~2 Mo non compressés.
    chunkSizeWarningLimit: 4000,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
