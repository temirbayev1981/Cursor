import { hasSupabase } from '@/lib/env'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { env } from '@/lib/env'

export const isSupabaseConfigured = hasSupabase

export const supabase = isSupabaseConfigured
  ? createClient<Database>(env.VITE_SUPABASE_URL!, env.VITE_SUPABASE_ANON_KEY!)
  : null

export const DEMO_MODE = !isSupabaseConfigured
