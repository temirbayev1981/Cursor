#!/usr/bin/env node
/**
 * Optional live Supabase connectivity and schema check.
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
 */
const url = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  if (process.env.SMOKE_OPTIONAL === '1') {
    console.log('Skipping Supabase smoke — VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set')
    process.exit(0)
  }
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
}

const REQUIRED_TABLES = [
  'companies',
  'profiles',
  'company_members',
  'team_invites',
  'portal_tokens',
  'audit_logs',
  'customer_reviews',
  'vendor_po_records',
]

const REQUIRED_RPCS = [
  ['check_rate_limit', { p_key: 'smoke', p_max_requests: 1, p_window_seconds: 60 }],
  ['validate_portal_token', { p_token: 'smoke-invalid-token' }],
  ['get_accessible_companies', {}],
  ['get_team_invite', { p_token: 'smoke-invalid-invite' }],
  ['get_portal_estimates', { p_token: 'smoke-invalid-token' }],
  ['portal_submit_review', { p_token: 'smoke-invalid-token', p_rating: 1, p_comment: null }],
] 

async function checkRest() {
  const endpoint = `${url}/rest/v1/companies?select=id&limit=1`
  const res = await fetch(endpoint, { headers })
  if (!res.ok) {
    console.error(`Supabase REST smoke failed: HTTP ${res.status}`)
    process.exit(1)
  }
  const rows = await res.json()
  console.log(`✓ REST reachable (${Array.isArray(rows) ? rows.length : 0} company row(s) sampled)`)
}

async function checkTable(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=0`, { headers })
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

async function checkRpc(name, body = {}) {
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (res.status === 404) {
    console.error(`✗ RPC missing: ${name} — re-apply supabase/schema.sql`)
    process.exit(1)
  }
  if (!res.ok) {
    const text = await res.text()
    console.error(`✗ RPC ${name} failed: HTTP ${res.status} ${text.slice(0, 120)}`)
    process.exit(1)
  }
  console.log(`✓ RPC ${name} reachable`)
}

await checkRest()
for (const table of REQUIRED_TABLES) {
  await checkTable(table)
}
for (const [name, body] of REQUIRED_RPCS) {
  await checkRpc(name, body)
}

console.log('✓ Supabase smoke passed')
