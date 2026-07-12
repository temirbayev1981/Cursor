import { defineConfig } from '@playwright/test'

const e2eEnv = [
  'VITE_E2E_MOCK_BACKEND=true',
  'VITE_SUPABASE_URL=https://e2e-mock.supabase.co',
  'VITE_SUPABASE_ANON_KEY=e2e-mock-anon-key',
  'VITE_ENABLE_E2E_ROUTES=true',
].join(' ')

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: `${e2eEnv} npm run build && npm run preview -- --host 127.0.0.1 --port 4173`,
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
})
