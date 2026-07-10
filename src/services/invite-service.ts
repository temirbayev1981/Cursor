import type { UserRole } from '@/types'
import { supabase, DEMO_MODE } from '@/lib/supabase'
import { loadStore, saveStore, upsertStore } from '@/lib/data-store'

export interface TeamInvite {
  id: string
  company_id: string
  email: string
  role: UserRole
  token: string
  invited_by?: string
  expires_at: string
  accepted_at?: string
  created_at: string
}

export interface TeamInvitePreview {
  email: string
  role: UserRole
  company_id: string
  company_name?: string
  expires_at: string
}

const INVITES_KEY = 'handymanos_team_invites'

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function createTeamInvite(
  companyId: string,
  email: string,
  role: UserRole,
  invitedBy?: string,
  daysValid = 7
): Promise<{ token: string; url: string; invite: TeamInvite }> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + daysValid * 86400000).toISOString()

  const invite: TeamInvite = {
    id: crypto.randomUUID(),
    company_id: companyId,
    email: email.toLowerCase().trim(),
    role,
    token,
    invited_by: invitedBy,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  }

  upsertStore(INVITES_KEY, invite)

  if (!DEMO_MODE && supabase) {
    const { error } = await supabase.from('team_invites').upsert(invite as never)
    if (error) throw error
  }

  const url = `${window.location.origin}/login?invite=${token}`
  return { token, url, invite }
}

export async function getTeamInvitePreview(token: string): Promise<TeamInvitePreview | null> {
  const local = loadStore<TeamInvite>(INVITES_KEY).find((i) => i.token === token)
  if (local && !local.accepted_at && new Date(local.expires_at).getTime() > Date.now()) {
    return {
      email: local.email,
      role: local.role,
      company_id: local.company_id,
      expires_at: local.expires_at,
    }
  }

  if (DEMO_MODE || !supabase) return null

  try {
    const { data, error } = await supabase.rpc(
      'get_team_invite' as never,
      { p_token: token } as never
    )
    if (error) return null
    const rows = data as Array<TeamInvitePreview & { accepted_at?: string }> | null
    if (!rows || rows.length === 0) return null

    const row = rows[0]
    if (row.accepted_at) return null
    if (new Date(row.expires_at).getTime() <= Date.now()) return null
    return row
  } catch {
    return null
  }
}

export async function acceptTeamInvite(token: string): Promise<TeamInvite | null> {
  const invites = loadStore<TeamInvite>(INVITES_KEY)
  const idx = invites.findIndex((i) => i.token === token)
  if (idx < 0) return null

  const invite = { ...invites[idx], accepted_at: new Date().toISOString() }
  invites[idx] = invite
  saveStore(INVITES_KEY, invites)

  if (!DEMO_MODE && supabase) {
    await supabase
      .from('team_invites')
      .update({ accepted_at: invite.accepted_at } as never)
      .eq('token', token)
  }

  return invite
}

export async function listTeamInvites(companyId: string): Promise<TeamInvite[]> {
  const items = loadStore<TeamInvite>(INVITES_KEY)
    .filter((i) => i.company_id === companyId && !i.accepted_at)
    .filter((i) => new Date(i.expires_at).getTime() > Date.now())

  if (DEMO_MODE || !supabase) return items

  try {
    const { data, error } = await supabase
      .from('team_invites')
      .select('*')
      .eq('company_id', companyId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error
    const remote = (data ?? []) as TeamInvite[]
    if (remote.length > 0) return remote
    return items
  } catch {
    return items
  }
}
