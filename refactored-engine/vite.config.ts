import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: 'public',
  server: {
    port: 8000,
    host: true,
    strictPort: true,
    fs: {
      // allow serving files from project root (outside "public")
      allow: [resolve(__dirname)]
    }
  },
  build: {
    target: 'ES2020',
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: 'public/index.html',
        game: 'public/game.html'
      }
    }
  }
})
