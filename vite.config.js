import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Read version.json — gracefully fall back if missing
let appVersion = 'dev'
let appBuilt = new Date().toISOString().slice(0, 10)
try {
  const v = JSON.parse(readFileSync(resolve(__dirname, 'version.json'), 'utf8'))
  appVersion = v.major !== undefined ? `v${v.major}.${v.minor}` : (v.version || 'dev')
} catch (_) {}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_BUILT__:   JSON.stringify(appBuilt),
  },
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      // Proxy /api/* to the WrenchIQ API server during development
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main:  resolve(__dirname, 'index.html'),
        oem:   resolve(__dirname, 'oem.html'),
        am3c:  resolve(__dirname, 'am-3c.html'),
      },
    },
  },
})
