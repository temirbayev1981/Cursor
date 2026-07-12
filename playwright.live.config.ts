import { defineConfig } from '@playwright/test'

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

const liveEnv = [
  `VITE_SUPABASE_URL=${supabaseUrl}`,
  `VITE_SUPABASE_ANON_KEY=${supabaseKey}`,
  process.env.VITE_STRIPE_PUBLISHABLE_KEY
    ? `VITE_STRIPE_PUBLISHABLE_KEY=${process.env.VITE_STRIPE_PUBLISHABLE_KEY}`
    : '',
].filter(Boolean).join(' ')

export default defineConfig({
  testDir: './e2e',
  testMatch: ['live-backend-smoke.spec.ts', 'stripe-live.spec.ts'],
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'on-first-retry',
  },
  webServer: {
    command: `${liveEnv} npm run build && npm run preview -- --host 127.0.0.1 --port 4174`,
    port: 4174,
    reuseExistingServer: !process.env.CI,
  },
})
