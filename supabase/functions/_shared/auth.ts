import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

export interface AuthContext {
  userId: string
  companyId: string | null
  supabase: SupabaseClient
}

export async function verifyAuth(req: Request): Promise<AuthContext | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !anonKey) return null

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  return {
    userId: user.id,
    companyId: (profile as { company_id: string | null } | null)?.company_id ?? null,
    supabase,
  }
}
