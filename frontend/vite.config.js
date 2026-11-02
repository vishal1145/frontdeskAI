import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

// Loads the font named in design-tokens.js. Imported at request time on purpose: a normal import
// makes it a config dependency, so every token save restarts the dev server and a refresh during
// that restart shows a blank page.
const injectFont = () => ({
  name: 'inject-font',
  transformIndexHtml: async () => {
    const tokensUrl = pathToFileURL(resolve(process.cwd(), 'design-tokens.js')).href
    const { font } = await import(`${tokensUrl}?t=${Date.now()}`)
    return [{ tag: 'link', attrs: { href: font.googleFontsUrl, rel: 'stylesheet' }, injectTo: 'head' }]
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), injectFont()],
  server: {
    host: true,
    allowedHosts: [
      'frontend-desk-ai.tryalgofolks.in',
      '.tryalgofolks.in'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
