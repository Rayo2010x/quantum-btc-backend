/**
 * prerender.mjs — Post-build SSR pre-rendering script
 *
 * HOW IT WORKS:
 *  1. Builds a server-side bundle from src/entry-server.tsx using Vite SSR mode
 *  2. Patches browser globals (localStorage, etc.) so React can render in Node.js
 *  3. Calls render() → gets the full HTML string of the app's initial state
 *  4. Injects the HTML into dist/index.html replacing the empty <div id="root"></div>
 *  5. Cleans up the temporary SSR build artifacts
 *
 * RESULT: dist/index.html contains real crawlable HTML for Googlebot.
 *
 * SECURITY NOTE: renderToString() does NOT run useEffect hooks, so no API
 * calls to the backend are made during pre-rendering. Only static initial
 * render is captured (the WhitePaper view, which is the default view).
 */

import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync, rmSync } from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const distDir = resolve(root, 'dist')
const distSsrDir = resolve(root, 'dist-ssr')

// ─── Step 1: Build SSR bundle ────────────────────────────────────────────────
console.log('\n🔨 [1/4] Building SSR bundle (react-dom/server)...')
await build({
  root,
  plugins: [react()],
  build: {
    ssr: resolve(root, 'src/entry-server.tsx'),
    outDir: distSsrDir,
    emptyOutDir: true,
  },
  // Suppress Vite build output for cleaner logs
  logLevel: 'warn',
})

// ─── Step 2: Patch browser globals for Node.js SSR context ────────────────────
// These are accessed by App.tsx at initialization time (useState initializers).
// useEffect callbacks are NOT executed by renderToString so API calls are safe.
console.log('🔧 [2/4] Patching browser globals for SSR context...')

global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
}

// Minimal window stub — only what React 19 needs for renderToString
global.window = global.window ?? {}

// ─── Step 3: Import SSR bundle and render ─────────────────────────────────────
console.log('🖥️  [3/4] Rendering app to static HTML...')
const ssrEntryPath = resolve(distSsrDir, 'entry-server.js')
// Fix for Windows: dynamic import() requires a file:// URL, not a raw C:\ path
const ssrEntryUrl = pathToFileURL(ssrEntryPath).href

let render
try {
  const mod = await import(ssrEntryUrl)
  render = mod.render
} catch (err) {
  console.error('❌ Failed to import SSR bundle:', err)
  process.exit(1)
}

let appHtml
try {
  appHtml = render()
} catch (err) {
  console.error('❌ renderToString() failed:', err)
  console.error('💡 Check if any component accesses browser-only APIs at render time.')
  process.exit(1)
}

// ─── Step 4: Inject into dist/index.html ──────────────────────────────────────
console.log('💾 [4/4] Injecting pre-rendered HTML into dist/index.html...')
const PLACEHOLDER = '<div id="root"></div>'
const template = readFileSync(resolve(distDir, 'index.html'), 'utf-8')

if (!template.includes(PLACEHOLDER)) {
  console.error('❌ Could not find <div id="root"></div> in dist/index.html')
  process.exit(1)
}

const finalHtml = template.replace(PLACEHOLDER, `<div id="root">${appHtml}</div>`)
writeFileSync(resolve(distDir, 'index.html'), finalHtml)

// ─── Cleanup SSR artifacts ─────────────────────────────────────────────────────
rmSync(distSsrDir, { recursive: true, force: true })

// ─── Verify ────────────────────────────────────────────────────────────────────
const seoCheck = finalHtml.includes('Securing Satoshi')
console.log('\n' + (seoCheck ? '✅' : '⚠️ ') + ' Pre-rendering ' + (seoCheck ? 'SUCCESS' : 'WARNING'))
if (seoCheck) {
  console.log('   Googlebot will now see real HTML content in dist/index.html')
  console.log('   Key SEO text found: "Securing Satoshi\'s Vision in the Quantum Era"')
} else {
  console.warn('   Pre-rendering completed but expected SEO text not found. Review the output.')
}
