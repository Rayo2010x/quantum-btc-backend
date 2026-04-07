import { renderToString } from 'react-dom/server'
import { StrictMode } from 'react'
import App from './App'

/**
 * SSR entry point for pre-rendering.
 * Called by scripts/prerender.mjs after `vite build`.
 * renderToString does NOT run useEffect, so no API calls are made server-side.
 */
export function render(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>
  )
}
