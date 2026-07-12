import { hasSupabase, isE2eMockBackend } from '@/lib/env'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/** True when a backend is available (live Supabase or E2E test mock). */
export const isBackendConfigured = hasSupabase || isE2eMockBackend

export let supabase: SupabaseClient<Database> | null =
  !isE2eMockBackend && hasSupabase
    ? createClient<Database>(env.VITE_SUPABASE_URL!, env.VITE_SUPABASE_ANON_KEY!)
    : null

/** Loads the in-memory E2E mock client without bundling it in production builds. */
export async function initSupabaseBackend(): Promise<void> {
  if (import.meta.env.VITE_E2E_MOCK_BACKEND !== 'true' || supabase) return
  const { createE2eMockSupabase } = await import('@/lib/e2e-mock-supabase')
  supabase = createE2eMockSupabase()
}

export async function getSupabaseAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const anonKey = env.VITE_SUPABASE_ANON_KEY
  if (anonKey) {
    headers.apikey = anonKey
  }
  if (!supabase) {
    if (anonKey) headers.Authorization = `Bearer ${anonKey}`
    return headers
  }

  const { data: { session } } = await supabase.auth.getSession()
  const accessToken = session?.access_token
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  } else if (anonKey) {
    headers.Authorization = `Bearer ${anonKey}`
  }
  return headers
}
