import { hasSupabase } from '@/lib/env'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { env } from '@/lib/env'

export const isSupabaseConfigured = hasSupabase

export const supabase = isSupabaseConfigured
  ? createClient<Database>(env.VITE_SUPABASE_URL!, env.VITE_SUPABASE_ANON_KEY!)
  : null

export const DEMO_MODE = !isSupabaseConfigured

export async function getSupabaseAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (!supabase) return headers

  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }
  return headers
}
