import { svelte } from '@sveltejs/vite-plugin-svelte'
import { createReadStream, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

const host = process.env.TAURI_DEV_HOST;
const isTauri = Boolean(process.env.TAURI_ENV_PLATFORM);

const require = createRequire(import.meta.url)
const aioneWebDir = dirname(require.resolve('aione-web'))

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
      if (isTauri) return;

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
      if (isTauri) return;

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

function collectPrecacheFiles(root: string) {
  const files: string[] = []

  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue

      const fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        walk(fullPath)
        continue
      }

      if (!entry.isFile()) continue

      const relativePath = relative(root, fullPath).split(sep).join('/')

      if (
        relativePath === 'sw.js' ||
        relativePath === '_headers' ||
        relativePath === '.nojekyll' ||
        relativePath.endsWith('.map')
      ) continue

      files.push(`./${relativePath}`)
    }
  }

  walk(root)
  return files.sort()
}

function serviceWorker(): Plugin {
  let outDir = ''

  return {
    name: 'aione-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    writeBundle() {
      const swPath = join(outDir, 'sw.js')

      if (!existsSync(swPath)) {
        console.warn('[service-worker] public/sw.js was not copied to the build output')
        return
      }

      const source = readFileSync(swPath, 'utf8')

      if (
        !source.includes('__AIONE_CACHE_VERSION__') ||
        !source.includes('/* __AIONE_PRECACHE_MANIFEST__ */ []')
      ) {
        console.warn('[service-worker] placeholders missing from public/sw.js')
        return
      }

      const precache = collectPrecacheFiles(outDir)
      const version = Date.now().toString(36)
      const output = source
        .replace('__AIONE_CACHE_VERSION__', version)
        .replace('/* __AIONE_PRECACHE_MANIFEST__ */ []', JSON.stringify(precache))

      writeFileSync(swPath, output)
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), aioneWebAssets(), serviceWorker()],
  base: "./",
  optimizeDeps: {
    exclude: ['aione-web']
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    headers: crossOriginIsolationHeaders,
    port: 1420,
    strictPort: true,
    host: host || "127.0.0.1",
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  preview: {
    headers: crossOriginIsolationHeaders
  },
  resolve: {
    tsconfigPaths: true
  },
});
