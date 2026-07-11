import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/error-message'

export async function ensureSupabaseSession(): Promise<boolean> {
  if (!supabase) return false

  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) return true

  const { data: { session: refreshed }, error } = await supabase.auth.refreshSession()
  if (error) {
    console.warn('Supabase session refresh failed:', getErrorMessage(error))
    return false
  }
  return Boolean(refreshed?.access_token)
}

export function hasSupabaseInvokeSupport(): boolean {
  return Boolean(supabase && typeof supabase.functions?.invoke === 'function')
}
