import { supabase, DEMO_MODE } from '@/lib/supabase'
import { upsertRows } from '@/lib/supabase-queries'
import { callRpc } from '@/lib/supabase-rpc'
import { loadStore, saveStore, upsertStore } from '@/lib/data-store'

export type PortalType = 'customer' | 'property'

export interface PortalToken {
  id: string
  company_id: string
  customer_id: string
  portal_type: PortalType
  token: string
  email?: string
  expires_at: string
  created_at: string
}

export interface PortalSession {
  customerId: string
  companyId: string
  portalType: PortalType
  customerName?: string
  expiresAt: number
  token: string
}

const TOKENS_KEY = 'handymanos_portal_tokens'
const SESSION_KEY = 'handymanos_portal_session'

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function getPortalSession(): PortalSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as PortalSession
    if (session.expiresAt < Date.now()) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export function getPortalToken(): string | null {
  return getPortalSession()?.token ?? null
}

export function setPortalSession(session: PortalSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  sessionStorage.removeItem('handymanos_portal_token')
}

export function clearPortalSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem('handymanos_portal_token')
}

export function isDemoPortalAccess(): boolean {
  return DEMO_MODE && sessionStorage.getItem('handymanos_portal_token') === 'demo'
}

export async function createPortalLink(
  companyId: string,
  customerId: string,
  portalType: PortalType,
  email?: string,
  daysValid = 7
): Promise<{ token: string; url: string; expiresAt: string }> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + daysValid * 86400000).toISOString()

  const record: PortalToken = {
    id: crypto.randomUUID(),
    company_id: companyId,
    customer_id: customerId,
    portal_type: portalType,
    token,
    email,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  }

  upsertStore(TOKENS_KEY, record)

  if (!DEMO_MODE && supabase) {
    const { error } = await upsertRows('portal_tokens', record)
    if (error) throw error
  }

  const path = '/portal/access'
  const url = `${window.location.origin}${path}?token=${token}`
  return { token, url, expiresAt }
}

function sessionFromLocalToken(local: PortalToken): PortalSession {
  return {
    customerId: local.customer_id,
    companyId: local.company_id,
    portalType: local.portal_type,
    expiresAt: new Date(local.expires_at).getTime(),
    token: local.token,
  }
}

export async function validatePortalToken(token: string): Promise<PortalSession | null> {
  if (DEMO_MODE || !supabase) {
    const localTokens = loadStore<PortalToken>(TOKENS_KEY)
    const local = localTokens.find((t) => t.token === token)
    if (local && new Date(local.expires_at).getTime() > Date.now()) {
      return sessionFromLocalToken(local)
    }
    return null
  }

  try {
    const { data, error } = await callRpc('validate_portal_token', { p_token: token })
    if (error) return null
    const rows = data
    if (!rows || rows.length === 0) return null

    const row = rows[0]
    const cached: PortalToken = {
      id: crypto.randomUUID(),
      company_id: row.company_id,
      customer_id: row.customer_id,
      portal_type: row.portal_type as PortalType,
      token,
      expires_at: row.expires_at,
      created_at: new Date().toISOString(),
    }
    upsertStore(TOKENS_KEY, cached)

    return {
      customerId: row.customer_id,
      companyId: row.company_id,
      portalType: row.portal_type as PortalType,
      customerName: row.customer_name,
      expiresAt: new Date(row.expires_at).getTime(),
      token,
    }
  } catch {
    return null
  }
}

export async function listPortalTokens(companyId: string): Promise<PortalToken[]> {
  const items = loadStore<PortalToken>(TOKENS_KEY).filter((t) => t.company_id === companyId)

  if (DEMO_MODE || !supabase) return items

  try {
    const { data, error } = await supabase
      .from('portal_tokens')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    const remote = (data ?? []) as PortalToken[]
    if (remote.length > 0) {
      saveStore(TOKENS_KEY, remote)
      return remote
    }
    return items
  } catch {
    return items
  }
}
