import { svelte } from '@sveltejs/vite-plugin-svelte'
import { createReadStream, existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

const require = createRequire(import.meta.url)
const aioneWebDir = dirname(require.resolve('aione-web/package.json'))

const AIONE_WEB_FILES = ['AIOneWeb.js', 'AIOneWeb.wasm']
const AIONE_WEB_TYPES: Record<string, string> = {
  '.js': 'text/javascript',
  '.wasm': 'application/wasm'
}

function aioneWebAssets(): Plugin {
  return {
    name: 'aione-web-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = decodeURIComponent((req.url ?? '').split('?')[0])
        const file = pathname.split('/').pop() ?? ''

        if (!AIONE_WEB_FILES.includes(file)) return next()

        const source = join(aioneWebDir, file)
        if (!existsSync(source)) return next()

        res.setHeader('Content-Type', AIONE_WEB_TYPES[extname(file)] ?? 'application/octet-stream')
        res.setHeader('Cache-Control', 'no-cache')
        createReadStream(source).on('error', next).pipe(res)
      })
    },
    generateBundle() {
      for (const file of AIONE_WEB_FILES) {
        this.emitFile({
          type: 'asset',
          fileName: file,
          source: readFileSync(join(aioneWebDir, file))
        })
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), aioneWebAssets()],
  base: "/AIOneSvelte-dist/",
  resolve: {
    tsconfigPaths: true
  }
})
