import path from 'path'
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))

function copyPdfWorker(): Plugin {
  const src = path.join(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs')
  const dest = path.join(__dirname, 'public/pdf.worker.min.mjs')
  return {
    name: 'copy-pdf-worker',
    buildStart() {
      copyFileSync(src, dest)
    },
  }
}

function baseAwareManifest(): Plugin {
  return {
    name: 'base-aware-manifest',
    closeBundle() {
      const base = process.env.VITE_BASE_PATH || '/'
      const prefix = base === '/' ? '' : base.replace(/\/$/, '')
      const manifestPath = path.join(__dirname, 'public/manifest.json')
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
        start_url: string
        icons: { src: string }[]
        shortcuts?: { url: string }[]
      }
      manifest.start_url = prefix ? `${prefix}/` : '/'
      manifest.icons = manifest.icons.map((icon) => ({
        ...icon,
        src: `${prefix}${icon.src}`,
      }))
      if (manifest.shortcuts) {
        manifest.shortcuts = manifest.shortcuts.map((shortcut) => ({
          ...shortcut,
          url: `${prefix}${shortcut.url}`,
        }))
      }
      writeFileSync(path.join(__dirname, 'dist/manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
    },
  }
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.VITE_APP_VERSION ?? pkg.version),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(
      process.env.VITE_BUILD_TIME ?? new Date().toISOString(),
    ),
  },
  plugins: [react(), tailwindcss(), copyPdfWorker(), baseAwareManifest()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'recharts'
          }
          if (id.includes('node_modules/xlsx')) {
            return 'xlsx'
          }
          if (id.includes('node_modules/@sentry')) {
            return 'sentry'
          }
          if (id.includes('node_modules/@supabase')) {
            return 'supabase'
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'motion'
          }
          if (id.includes('node_modules/date-fns')) {
            return 'date-fns'
          }
          if (id.includes('node_modules/@dnd-kit')) {
            return 'dnd-kit'
          }
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run/router')) {
            return 'router'
          }
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query'
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons'
          }
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix'
          }
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react-vendor'
          }
        },
      },
    },
  },
})
