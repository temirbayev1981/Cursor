/**
 * In-memory Supabase-compatible client for Playwright E2E only.
 * Activated when VITE_E2E_MOCK_BACKEND=true — not used in production deploys.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import {
  DEMO_COMPANY,
  DEMO_COMPANY_B,
  DEMO_CUSTOMERS,
  DEMO_CUSTOMERS_B,
  DEMO_EMPLOYEES,
  DEMO_EMPLOYEES_B,
  DEMO_ESTIMATES,
  DEMO_EXPENSES,
  DEMO_INVOICES,
  DEMO_JOBS,
  DEMO_JOBS_B,
  DEMO_MATERIALS,
  DEMO_MATERIALS_B,
  DEMO_PROPERTIES,
  DEMO_SCHEDULE,
  DEMO_SERVICES,
  DEMO_VEHICLES,
  DEMO_WORK_ORDERS,
  DEMO_FUEL_LOGS,
} from '@/data/mock-data'
import { SEED_VENDOR_POS } from '@/data/seed-vendor-pos'
import type { UserRole } from '@/types'

type Row = Record<string, unknown>
type DbClient = SupabaseClient<Database>

function asRows<T>(items: T[]): Row[] {
  return items as unknown as Row[]
}

const DB_PREFIX = '__e2e_supabase__'
const SESSION_KEY = '__e2e_auth_session__'
const SEEDED_KEY = '__e2e_db_seeded__'
export const E2E_ONBOARDING_FRESH_KEY = 'handymanos_e2e_onboarding_fresh'

const DEFAULT_OWNER = {
  id: 'user-001',
  email: 'owner@profixhandyman.com',
  full_name: 'Alex Morgan',
  role: 'owner' as UserRole,
  company_id: DEMO_COMPANY.id,
  phone: '(555) 123-4567',
  created_at: '2024-01-15T00:00:00Z',
}

function loadTable(table: string): Row[] {
  try {
    const raw = localStorage.getItem(`${DB_PREFIX}${table}`)
    return raw ? (JSON.parse(raw) as Row[]) : []
  } catch {
    return []
  }
}

function saveTable(table: string, rows: Row[]): void {
  localStorage.setItem(`${DB_PREFIX}${table}`, JSON.stringify(rows))
}

function upsertRow(table: string, row: Row, conflictKey = 'id'): void {
  const rows = loadTable(table)
  const idx = conflictKey.includes(',')
    ? rows.findIndex((r) => conflictKey.split(',').every((key) => r[key.trim()] === row[key.trim()]))
    : rows.findIndex((r) => r[conflictKey] === row[conflictKey])
  if (idx >= 0) rows[idx] = { ...rows[idx], ...row }
  else rows.push(row)
  saveTable(table, rows)
}

function ensureSeeded(): void {
  if (localStorage.getItem(SEEDED_KEY) === 'true') return

  saveTable('companies', asRows([DEMO_COMPANY, DEMO_COMPANY_B]))
  saveTable('profiles', asRows([DEFAULT_OWNER]))
  saveTable('company_members', asRows([
    { company_id: DEMO_COMPANY.id, profile_id: DEFAULT_OWNER.id, role: 'owner' },
    { company_id: DEMO_COMPANY_B.id, profile_id: DEFAULT_OWNER.id, role: 'owner' },
  ]))
  saveTable('customers', asRows([...DEMO_CUSTOMERS, ...DEMO_CUSTOMERS_B]))
  saveTable('jobs', asRows([...DEMO_JOBS, ...DEMO_JOBS_B]))
  saveTable('estimates', asRows(DEMO_ESTIMATES))
  saveTable('invoices', asRows(DEMO_INVOICES))
  saveTable('properties', asRows(DEMO_PROPERTIES))
  saveTable('employees', asRows([...DEMO_EMPLOYEES, ...DEMO_EMPLOYEES_B]))
  saveTable('materials', asRows([...DEMO_MATERIALS, ...DEMO_MATERIALS_B]))
  saveTable('vehicles', asRows(DEMO_VEHICLES))
  saveTable('expenses', asRows(DEMO_EXPENSES))
  saveTable('schedule_events', asRows(DEMO_SCHEDULE))
  saveTable('work_orders', asRows(DEMO_WORK_ORDERS))
  saveTable('service_catalog', asRows(DEMO_SERVICES))
  saveTable('fuel_logs', asRows(DEMO_FUEL_LOGS))
  saveTable('vendor_po_records', asRows(SEED_VENDOR_POS))
  saveTable('portal_tokens', [{
    id: 'pt-e2e-customer',
    company_id: DEMO_COMPANY.id,
    customer_id: 'cust-002',
    portal_type: 'customer',
    token: 'e2e-portal-customer-token',
    expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  }, {
    id: 'pt-e2e-property',
    company_id: DEMO_COMPANY.id,
    customer_id: 'cust-001',
    portal_type: 'property',
    token: 'e2e-portal-property-token',
    expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  }])

  localStorage.setItem(SEEDED_KEY, 'true')
  localStorage.setItem('handymanos_company_registry', JSON.stringify([DEMO_COMPANY, DEMO_COMPANY_B]))
  syncE2eMockToEntityCache()
}

function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) as { user: { id: string; email: string }; access_token: string } : null
  } catch {
    return null
  }
}

function setSession(user: { id: string; email: string }): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    user: { id: user.id, email: user.email },
    access_token: `e2e-token-${user.id}`,
  }))
}

function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

function applyFilters(rows: Row[], filters: Filter[]): Row[] {
  return rows.filter((row) =>
    filters.every((f) => {
      const val = row[f.column]
      if (f.op === 'eq') return val === f.value
      if (f.op === 'in') return Array.isArray(f.value) && f.value.includes(val)
      if (f.op === 'is') return f.value === null ? val == null : val === f.value
      if (f.op === 'gt') return String(val) > String(f.value)
      return true
    }),
  )
}

interface Filter {
  op: 'eq' | 'in' | 'is' | 'gt'
  column: string
  value: unknown
}

class MockQueryBuilder implements PromiseLike<{ data: unknown; error: { message: string } | null }> {
  private table: string
  private op: 'select' | 'insert' | 'upsert' | 'update' | 'delete' = 'select'
  private filters: Filter[] = []
  private payload: Row | Row[] | null = null
  private orderCol: string | null = null
  private orderAsc = true
  private singleRow = false
  private maybeSingleRow = false
  private limitCount: number | null = null
  private rangeFrom: number | null = null
  private rangeTo: number | null = null
  private countExact = false
  private upsertConflict: string | null = null

  constructor(table: string) {
    this.table = table
    ensureSeeded()
  }

  select(_columns = '*', options?: { count?: 'exact' }) {
    this.countExact = options?.count === 'exact'
    return this
  }
  insert(rows: Row | Row[]) { this.op = 'insert'; this.payload = rows; return this }
  upsert(rows: Row | Row[], opts?: { onConflict?: string }) {
    this.op = 'upsert'
    this.payload = rows
    this.upsertConflict = opts?.onConflict ?? 'id'
    return this
  }
  update(values: Row) { this.op = 'update'; this.payload = values; return this }
  delete() { this.op = 'delete'; return this }
  eq(column: string, value: unknown) { this.filters.push({ op: 'eq', column, value }); return this }
  in(column: string, value: unknown[]) { this.filters.push({ op: 'in', column, value }); return this }
  is(column: string, value: null) { this.filters.push({ op: 'is', column, value }); return this }
  gt(column: string, value: unknown) { this.filters.push({ op: 'gt', column, value }); return this }
  order(column: string, opts?: { ascending?: boolean }) {
    this.orderCol = column
    this.orderAsc = opts?.ascending !== false
    return this
  }
  single() { this.singleRow = true; return this }
  maybeSingle() { this.maybeSingleRow = true; this.singleRow = true; return this }
  limit(n: number) { this.limitCount = n; return this }
  range(from: number, to: number) {
    this.rangeFrom = from
    this.rangeTo = to
    return this
  }

  then<TResult1 = { data: unknown; error: { message: string } | null; count?: number | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: { message: string } | null; count?: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected)
  }

  private execute(): { data: unknown; error: { message: string } | null; count?: number | null } {
    let rows = loadTable(this.table)

    if (this.op === 'insert' || this.op === 'upsert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload!]
      for (const item of items) {
        if (this.op === 'upsert' && this.upsertConflict) {
          upsertRow(this.table, item, this.upsertConflict)
        } else {
          upsertRow(this.table, item)
        }
      }
      rows = loadTable(this.table)
      const inserted = items.map((i) => rows.find((r) => r.id === i.id) ?? i)
      return { data: this.singleRow ? inserted[0] : inserted, error: null }
    }

    if (this.op === 'update') {
      const filtered = applyFilters(rows, this.filters)
      for (const row of filtered) {
        upsertRow(this.table, { ...row, ...this.payload! })
      }
      rows = loadTable(this.table)
      const updated = applyFilters(rows, this.filters)
      return { data: this.singleRow ? updated[0] ?? null : updated, error: null }
    }

    if (this.op === 'delete') {
      const keep = rows.filter((row) => !applyFilters([row], this.filters).length)
      saveTable(this.table, keep)
      return { data: null, error: null }
    }

    rows = applyFilters(rows, this.filters)
    if (this.orderCol) {
      rows.sort((a, b) => {
        const av = String(a[this.orderCol!] ?? '')
        const bv = String(b[this.orderCol!] ?? '')
        return this.orderAsc ? av.localeCompare(bv) : bv.localeCompare(av)
      })
    }
    if (this.limitCount != null) {
      rows = rows.slice(0, this.limitCount)
    }
    const totalCount = rows.length
    if (this.rangeFrom != null && this.rangeTo != null) {
      rows = rows.slice(this.rangeFrom, this.rangeTo + 1)
    }
    if (this.singleRow) {
      const row = rows[0] ?? null
      if (!row && !this.maybeSingleRow) {
        return { data: null, error: { message: 'Row not found' }, count: this.countExact ? totalCount : null }
      }
      return { data: row, error: null, count: this.countExact ? totalCount : null }
    }
    return { data: rows, error: null, count: this.countExact ? totalCount : null }
  }
}

function portalTokenRow(token: string) {
  return loadTable('portal_tokens').find((t) => t.token === token)
}

function handleRpc(fn: string, args: Record<string, unknown>): { data: unknown; error: null } {
  ensureSeeded()

  if (fn === 'validate_portal_token') {
    const token = String(args.p_token ?? '')
    const row = portalTokenRow(token)
    if (!row || new Date(String(row.expires_at)).getTime() <= Date.now()) return { data: [], error: null }
    const customer = loadTable('customers').find((c) => c.id === row.customer_id)
    return {
      data: [{
        company_id: row.company_id,
        customer_id: row.customer_id,
        portal_type: row.portal_type,
        expires_at: row.expires_at,
        customer_name: customer?.name ?? 'Customer',
      }],
      error: null,
    }
  }

  if (fn === 'get_accessible_companies') {
    const session = getSession()
    const profileId = session?.user.id ?? DEFAULT_OWNER.id
    const memberRows = loadTable('company_members').filter((m) => m.profile_id === profileId)
    const companies = loadTable('companies').filter((c) =>
      memberRows.some((m) => m.company_id === c.id),
    )
    return { data: companies.length ? companies : [DEMO_COMPANY], error: null }
  }

  if (fn === 'get_team_invite') {
    const token = String(args.p_token ?? '')
    const invite = loadTable('team_invites').find((i) => i.token === token && !i.accepted_at)
    if (!invite || new Date(String(invite.expires_at)).getTime() <= Date.now()) return { data: [], error: null }
    const company = loadTable('companies').find((c) => c.id === invite.company_id)
    return {
      data: [{
        email: invite.email,
        role: invite.role,
        company_id: invite.company_id,
        company_name: company?.name,
        expires_at: invite.expires_at,
        accepted_at: invite.accepted_at,
      }],
      error: null,
    }
  }

  if (fn === 'accept_team_invite') {
    const token = String(args.p_token ?? '')
    const invites = loadTable('team_invites')
    const idx = invites.findIndex((i) => i.token === token)
    if (idx < 0) return { data: false, error: null }
    invites[idx] = { ...invites[idx], accepted_at: new Date().toISOString() }
    saveTable('team_invites', invites)
    const invite = invites[idx]
    const session = getSession()
    const profiles = loadTable('profiles')
    const profileIdx = profiles.findIndex((p) =>
      p.email === invite.email || (session?.user.id && p.id === session.user.id),
    )
    if (profileIdx >= 0) {
      profiles[profileIdx] = { ...profiles[profileIdx], company_id: invite.company_id, role: invite.role }
      saveTable('profiles', profiles)
      upsertRow('company_members', {
        company_id: invite.company_id,
        profile_id: profiles[profileIdx].id,
        role: invite.role,
      })
    }
    return { data: true, error: null }
  }

  if (fn === 'provision_owner_company') {
    const session = getSession()
    if (!session?.user.id) return { data: null, error: null }
    const profiles = loadTable('profiles')
    const profileIdx = profiles.findIndex((p) => p.id === session.user.id)
    if (profileIdx < 0) return { data: null, error: null }
    if (profiles[profileIdx].company_id) {
      return { data: profiles[profileIdx].company_id, error: null }
    }
    const companyId = crypto.randomUUID()
    const fullName = String(profiles[profileIdx].full_name ?? session.user.email.split('@')[0])
    upsertRow('companies', {
      id: companyId,
      name: `${fullName}'s Handyman Co.`,
      email: session.user.email,
      phone: '',
      address: '',
      subscription_plan: 'starter',
      settings: {},
      created_at: new Date().toISOString(),
    })
    profiles[profileIdx] = { ...profiles[profileIdx], company_id: companyId, role: 'owner' }
    saveTable('profiles', profiles)
    upsertRow('company_members', { company_id: companyId, profile_id: session.user.id, role: 'owner' })
    return { data: companyId, error: null }
  }

  if (fn === 'get_portal_estimates' || fn === 'get_portal_invoices' || fn === 'get_portal_jobs') {
    const token = String(args.p_token ?? '')
    const portal = portalTokenRow(token)
    if (!portal) return { data: [], error: null }
    const table = fn === 'get_portal_estimates' ? 'estimates' : fn === 'get_portal_invoices' ? 'invoices' : 'jobs'
    const rows = loadTable(table).filter((r) => r.customer_id === portal.customer_id)
    return { data: rows, error: null }
  }

  if (fn === 'portal_update_estimate_status') {
    const token = String(args.p_token ?? '')
    const portal = portalTokenRow(token)
    const estimateId = String(args.p_estimate_id ?? '')
    const status = String(args.p_status ?? '')
    if (!portal) return { data: false, error: null }
    const estimates = loadTable('estimates')
    const idx = estimates.findIndex((e) => e.id === estimateId && e.customer_id === portal.customer_id)
    if (idx < 0) return { data: false, error: null }
    estimates[idx] = { ...estimates[idx], status }
    saveTable('estimates', estimates)
    return { data: true, error: null }
  }

  if (fn === 'portal_submit_job_request') {
    const token = String(args.p_token ?? '')
    const portal = portalTokenRow(token)
    if (!portal) return { data: null, error: null }
    const jobId = crypto.randomUUID()
    upsertRow('jobs', {
      id: jobId,
      company_id: portal.company_id,
      customer_id: portal.customer_id,
      title: args.p_title,
      description: args.p_description,
      status: 'draft',
      priority: args.p_priority ?? 'medium',
      estimated_hours: 2,
      actual_hours: 0,
      revenue: 0,
      labor_cost: 0,
      material_cost: 0,
      fuel_cost: 0,
      overhead_cost: 0,
      profit: 0,
      profit_margin: 0,
      created_at: new Date().toISOString(),
    })
    return { data: jobId, error: null }
  }

  if (fn === 'portal_submit_review') {
    const token = String(args.p_token ?? '')
    const portal = portalTokenRow(token)
    if (!portal) return { data: false, error: null }
    upsertRow('customer_reviews', {
      id: crypto.randomUUID(),
      company_id: portal.company_id,
      customer_id: portal.customer_id,
      rating: args.p_rating,
      comment: args.p_comment,
      created_at: new Date().toISOString(),
    })
    return { data: true, error: null }
  }

  if (fn === 'portal_get_notification_preferences') {
    const token = String(args.p_token ?? '')
    const portal = portalTokenRow(token)
    if (!portal) return { data: null, error: null }
    const customers = loadTable('customers')
    const customer = customers.find((c) => c.id === portal.customer_id)
    const prefs = customer?.notification_preferences ?? { email: true, sms: false }
    return { data: prefs, error: null }
  }

  if (fn === 'portal_update_notification_preferences') {
    const token = String(args.p_token ?? '')
    const portal = portalTokenRow(token)
    if (!portal) return { data: false, error: null }
    const customers = loadTable('customers')
    const idx = customers.findIndex((c) => c.id === portal.customer_id)
    if (idx < 0) return { data: false, error: null }
    customers[idx] = {
      ...customers[idx],
      notification_preferences: { email: args.p_email, sms: args.p_sms },
    }
    saveTable('customers', customers)
    return { data: true, error: null }
  }

  return { data: null, error: null }
}

export function createE2eMockSupabase(): DbClient {
  ensureSeeded()

  const authListeners: Array<(event: string, session: unknown) => void> = []

  const client = {
    auth: {
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        if (!password || password.length < 6) {
          return { data: { user: null, session: null }, error: { message: 'Invalid credentials' } }
        }
        const profiles = loadTable('profiles')
        const profile = profiles.find((p) => String(p.email).toLowerCase() === email.toLowerCase())
          ?? { ...DEFAULT_OWNER, email }
        if (!profile.id) profile.id = DEFAULT_OWNER.id
        setSession({ id: String(profile.id), email: String(profile.email) })
        const session = getSession()
        authListeners.forEach((cb) => cb('SIGNED_IN', session))
        return {
          data: { user: { id: profile.id, email: profile.email }, session },
          error: null,
        }
      },
      signUp: async ({ email, password: _password, options }: { email: string; password: string; options?: { data?: { full_name?: string; signup_type?: string } } }) => {
        const userId = crypto.randomUUID()
        const fullName = options?.data?.full_name ?? email.split('@')[0]
        const signupType = options?.data?.signup_type ?? 'owner'

        if (signupType !== 'invite') {
          const companyId = crypto.randomUUID()
          upsertRow('companies', {
            id: companyId,
            name: `${fullName}'s Handyman Co.`,
            email,
            phone: '',
            address: '',
            subscription_plan: 'starter',
            settings: {},
            created_at: new Date().toISOString(),
          })
          upsertRow('profiles', {
            id: userId,
            company_id: companyId,
            email,
            full_name: fullName,
            role: 'owner',
            created_at: new Date().toISOString(),
          })
          upsertRow('company_members', { company_id: companyId, profile_id: userId, role: 'owner' })
        } else {
          upsertRow('profiles', {
            id: userId,
            email,
            full_name: fullName,
            role: 'technician',
            created_at: new Date().toISOString(),
          })
        }

        setSession({ id: userId, email })
        return {
          data: { user: { id: userId, email }, session: getSession() },
          error: null,
        }
      },
      signOut: async () => {
        clearSession()
        authListeners.forEach((cb) => cb('SIGNED_OUT', null))
        return { error: null }
      },
      getSession: async () => ({ data: { session: getSession() }, error: null }),
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        authListeners.push(cb)
        return { data: { subscription: { unsubscribe: () => {
          const idx = authListeners.indexOf(cb)
          if (idx >= 0) authListeners.splice(idx, 1)
        } } } }
      },
    },
    from: (table: string) => new MockQueryBuilder(table),
    rpc: (fn: string, args: Record<string, unknown>) => Promise.resolve(handleRpc(fn, args)),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
    removeChannel: () => {},
    storage: {
      from: () => ({
        upload: async (_path: string, file: File) => ({
          data: { path: URL.createObjectURL(file) },
          error: null,
        }),
        createSignedUrl: async (path: string) => ({
          data: { signedUrl: path.startsWith('blob:') ? path : `https://e2e.local/${path}` },
          error: null,
        }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: path } }),
      }),
    },
  }

  return client as unknown as DbClient
}

/** Sync E2E mock tables into handymanos_* localStorage keys used by entity-service cache. */
export function syncE2eMockToEntityCache(): void {
  const map: Record<string, string> = {
    jobs: 'handymanos_jobs',
    customers: 'handymanos_customers',
    estimates: 'handymanos_estimates',
    invoices: 'handymanos_invoices',
    properties: 'handymanos_properties',
    employees: 'handymanos_employees',
    materials: 'handymanos_materials',
    vehicles: 'handymanos_vehicles',
    expenses: 'handymanos_expenses',
    schedule_events: 'handymanos_schedules',
    work_orders: 'handymanos_work_orders',
    service_catalog: 'handymanos_services',
    fuel_logs: 'handymanos_fuel_logs',
  }
  for (const [table, key] of Object.entries(map)) {
    localStorage.setItem(key, JSON.stringify(loadTable(table)))
  }
  localStorage.setItem('handymanos_vendor_pos', JSON.stringify(loadTable('vendor_po_records')))
  if (!localStorage.getItem('handymanos_active_company')) {
    localStorage.setItem('handymanos_active_company', DEMO_COMPANY.id)
  }
  if (!localStorage.getItem('handymanos_company')) {
    localStorage.setItem('handymanos_company', JSON.stringify(DEMO_COMPANY))
  }
  if (
    !localStorage.getItem('handymanos_onboarding')
    && !sessionStorage.getItem(E2E_ONBOARDING_FRESH_KEY)
  ) {
    localStorage.setItem('handymanos_onboarding', 'complete')
  }
}
