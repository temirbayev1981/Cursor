import { hasSupabase, isE2eMockBackend } from '@/lib/env'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { env } from '@/lib/env'
import { createE2eMockSupabase } from '@/lib/e2e-mock-supabase'

/** True when a backend is available (live Supabase or E2E test mock). */
export const isBackendConfigured = hasSupabase || isE2eMockBackend

export const supabase = isE2eMockBackend
  ? createE2eMockSupabase()
  : hasSupabase
    ? createClient<Database>(env.VITE_SUPABASE_URL!, env.VITE_SUPABASE_ANON_KEY!)
    : null

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
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  } else if (anonKey) {
    headers.Authorization = `Bearer ${anonKey}`
  }
  return headers
}
