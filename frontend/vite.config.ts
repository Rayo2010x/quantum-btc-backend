import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-expect-error: vite-plugin-prerender does not ship TypeScript typings
import prerender from 'vite-plugin-prerender'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    prerender({
      // Absolute path to the built static files
      staticDir: path.join(__dirname, 'dist'),
      // List of routes to pre-render. Add more here if new static pages are created.
      // IMPORTANT: Do NOT add game/play routes here — they are geo-blocked.
      routes: ['/'],
    }),
  ],
})
