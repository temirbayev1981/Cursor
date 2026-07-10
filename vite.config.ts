import path from 'path'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.VITE_APP_VERSION ?? pkg.version),
  },
  plugins: [react(), tailwindcss()],
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
          if (id.includes('node_modules/pdfjs-dist')) {
            return 'pdfjs'
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
