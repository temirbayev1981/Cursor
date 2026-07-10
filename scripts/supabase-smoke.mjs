#!/usr/bin/env node
/**
 * Optional live Supabase connectivity check.
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
 */
const url = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
}

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
await checkRpc('validate_portal_token', { p_token: 'smoke-invalid-token' })
await checkRpc('get_accessible_companies', {})

console.log('✓ Supabase smoke passed')
