import { svelte } from '@sveltejs/vite-plugin-svelte'
import { createReadStream, existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

const require = createRequire(import.meta.url)
const aioneWebDir = dirname(require.resolve('aione-web/package.json'))

interface AioneAsset {
  url: string
  sources: string[]
}

const AIONE_WEB_ASSETS: AioneAsset[] = [
  {
    url: 'worker-runtime.js',
    sources: ['worker-runtime.js', 'worker-runtime.js']
  },
  {
    url: 'build/Release/AIOneWeb.js',
    sources: ['build/Release/AIOneWeb.js', 'AIOneWeb.js']
  },
  {
    url: 'build/Release/AIOneWeb.wasm',
    sources: ['build/Release/AIOneWeb.wasm', 'AIOneWeb.wasm']
  },
  {
    url: 'build/Release-mt/AIOneWebMT.js',
    sources: ['build/Release-mt/AIOneWebMT.js']
  },
  {
    url: 'build/Release-mt/AIOneWebMT.wasm',
    sources: ['build/Release-mt/AIOneWebMT.wasm']
  }
]

const AIONE_WEB_TYPES: Record<string, string> = {
  '.js': 'text/javascript',
  '.wasm': 'application/wasm'
}

const crossOriginIsolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp'
}

function findAssetSource(asset: AioneAsset) {
  for (const file of asset.sources) {
    const source = join(aioneWebDir, ...file.split('/'))
    if (existsSync(source)) return source
  }
}

function aioneWebAssets(): Plugin {
  return {
    name: 'aione-web-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = decodeURIComponent((req.url ?? '').split('?')[0])
        const asset = AIONE_WEB_ASSETS.find(({ url }) => pathname.endsWith(`/${url}`))

        if (!asset) return next()

        const source = findAssetSource(asset)
        if (!source) return next()

        res.setHeader('Content-Type', AIONE_WEB_TYPES[extname(asset.url)] ?? 'application/octet-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
        for (const [name, value] of Object.entries(crossOriginIsolationHeaders)) {
          res.setHeader(name, value)
        }

        if (req.method === 'HEAD') {
          res.end()
          return
        }

        createReadStream(source).on('error', next).pipe(res)
      })
    },
    generateBundle() {
      for (const asset of AIONE_WEB_ASSETS) {
        const source = findAssetSource(asset)
        if (!source) continue

        this.emitFile({
          type: 'asset',
          fileName: asset.url,
          source: readFileSync(source)
        })
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), aioneWebAssets()],
  base: "/",
  server: {
    headers: crossOriginIsolationHeaders
  },
  preview: {
    headers: crossOriginIsolationHeaders
  },
  resolve: {
    tsconfigPaths: true
  }
})
