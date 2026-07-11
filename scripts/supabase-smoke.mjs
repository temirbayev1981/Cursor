#!/usr/bin/env node
/**
 * Optional live Supabase connectivity and schema check.
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
 * Service-role RPCs (check_rate_limit) require SUPABASE_SERVICE_ROLE_KEY.
 */
const url = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anonKey) {
  if (process.env.SMOKE_OPTIONAL === '1') {
    console.log('Skipping Supabase smoke — VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set')
    process.exit(0)
  }
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

function buildHeaders(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

const anonHeaders = buildHeaders(anonKey)

const REQUIRED_TABLES = [
  'companies',
  'profiles',
  'company_members',
  'team_invites',
  'portal_tokens',
  'integration_probe_runs',
  'audit_logs',
  'customer_reviews',
  'vendor_po_records',
]

/** RPCs granted to anon/authenticated — callable with anon API key. */
const ANON_RPCS = [
  ['validate_portal_token', { p_token: 'smoke-invalid-token' }],
  ['get_team_invite', { p_token: 'smoke-invalid-invite' }],
  ['get_portal_estimates', { p_token: 'smoke-invalid-token' }],
  ['portal_submit_review', { p_token: 'smoke-invalid-token', p_rating: 1, p_comment: null }],
  ['portal_get_notification_preferences', { p_token: 'smoke-invalid-token' }],
  ['portal_update_notification_preferences', { p_token: 'smoke-invalid-token', p_email: true, p_sms: false }],
]

/** RPCs granted only to service_role — not visible to anon (404 with anon key). */
const SERVICE_RPCS = [
  ['check_rate_limit', { p_key: 'smoke', p_limit: 1, p_window_seconds: 60 }],
]

const EDGE_FUNCTIONS = [
  'create-checkout-session',
  'create-subscription-checkout',
  'openai-proxy',
  'send-notification',
  'send-sms',
  'stripe-webhook',
]

const REACHABLE_STATUSES = new Set([200, 204, 401, 405])

function shouldWarnOnly() {
  return process.env.SMOKE_RPC_OPTIONAL === '1'
}

async function checkRest() {
  const endpoint = `${url}/rest/v1/companies?select=id&limit=1`
  const res = await fetch(endpoint, { headers: anonHeaders })
  if (!res.ok) {
    console.error(`Supabase REST smoke failed: HTTP ${res.status}`)
    process.exit(1)
  }
  const rows = await res.json()
  console.log(`✓ REST reachable (${Array.isArray(rows) ? rows.length : 0} company row(s) sampled)`)
}

async function checkTable(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=0`, { headers: anonHeaders })
  if (res.status === 404) {
    console.error(`✗ Table missing: ${table} — re-apply supabase/schema.sql`)
    process.exit(1)
  }
  if (!res.ok) {
    const text = await res.text()
    console.error(`✗ Table ${table} failed: HTTP ${res.status} ${text.slice(0, 120)}`)
    process.exit(1)
  }
  console.log(`✓ Table ${table} reachable`)
}

async function checkRpc(name, body = {}, headers = anonHeaders) {
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (res.status === 404) {
    const hint = name === 'check_rate_limit'
      ? 'run supabase/migrations/20260711000002_check_rate_limit.sql (or schema-smoke-minimal.sql)'
      : 're-apply supabase/schema.sql'
    const msg = `RPC missing: ${name} — ${hint}`
    if (shouldWarnOnly()) {
      console.warn(`⚠ ${msg}`)
      return
    }
    console.error(`✗ ${msg}`)
    process.exit(1)
  }
  if (!res.ok) {
    const text = await res.text()
    const msg = `RPC ${name} failed: HTTP ${res.status} ${text.slice(0, 120)}`
    if (shouldWarnOnly()) {
      console.warn(`⚠ ${msg}`)
      return
    }
    console.error(`✗ ${msg}`)
    process.exit(1)
  }
  console.log(`✓ RPC ${name} reachable`)
}

async function checkServiceRpcs() {
  if (!serviceKey) {
    const msg = 'SUPABASE_SERVICE_ROLE_KEY not set — skipping service_role RPC checks (check_rate_limit)'
    if (shouldWarnOnly()) {
      console.warn(`⚠ ${msg}`)
      return
    }
    console.error(`✗ ${msg}`)
    console.error('  Add SUPABASE_SERVICE_ROLE_KEY to GitHub Secrets for strict supabase-smoke')
    process.exit(1)
  }

  const headers = buildHeaders(serviceKey)
  for (const [name, body] of SERVICE_RPCS) {
    await checkRpc(name, body, headers)
  }
}

async function checkEdgeFunction(name) {
  const endpoint = `${url}/functions/v1/${name}`
  let reachable = false
  try {
    const res = await fetch(endpoint, { method: 'OPTIONS', headers: anonHeaders })
    reachable = REACHABLE_STATUSES.has(res.status) || res.ok
  } catch {
    reachable = false
  }
  if (!reachable) {
    try {
      const res = await fetch(endpoint, { method: 'GET', headers: anonHeaders })
      reachable = REACHABLE_STATUSES.has(res.status) || res.ok
    } catch {
      reachable = false
    }
  }
  if (!reachable) {
    const msg = `Edge Function unreachable: ${name} — deploy supabase/functions/${name}`
    if (process.env.SMOKE_EDGE_FUNCTIONS_OPTIONAL === '1') {
      console.warn(`⚠ ${msg}`)
      return
    }
    console.error(`✗ ${msg}`)
    process.exit(1)
  }
  console.log(`✓ Edge Function ${name} reachable`)
}

await checkRest()
for (const table of REQUIRED_TABLES) {
  await checkTable(table)
}
for (const [name, body] of ANON_RPCS) {
  await checkRpc(name, body)
}
await checkServiceRpcs()

if (process.env.SMOKE_EDGE_FUNCTIONS === '1') {
  console.log('\nEdge Functions:')
  for (const fn of EDGE_FUNCTIONS) {
    await checkEdgeFunction(fn)
  }
}

console.log('✓ Supabase smoke passed')
