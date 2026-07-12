import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initObservability } from '@/lib/observability'
import { registerServiceWorker } from '@/lib/pwa'
import { installChunkLoadRecovery } from '@/lib/chunk-reload'
import { initSupabaseBackend } from '@/lib/supabase'
import { isE2eMockBackend } from '@/lib/env'

async function bootstrap() {
  if (isE2eMockBackend) {
    await initSupabaseBackend()
  }

  initObservability()
  installChunkLoadRecovery()
  registerServiceWorker()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
