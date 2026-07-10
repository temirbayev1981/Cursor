import type { Database } from '@/types/database'
import { supabase } from '@/lib/supabase'

type PublicFunctions = Database['public']['Functions']

export async function callRpc<T extends keyof PublicFunctions>(
  fn: T,
  args: PublicFunctions[T]['Args'],
): Promise<{ data: PublicFunctions[T]['Returns'] | null; error: Error | null }> {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }
  const { data, error } = await supabase.rpc(fn, args as never)
  return {
    data: (data ?? null) as PublicFunctions[T]['Returns'] | null,
    error: error ? new Error(error.message) : null,
  }
}
