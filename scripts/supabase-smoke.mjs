#!/usr/bin/env node
/**
 * Optional live Supabase connectivity check.
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
 */
const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const endpoint = `${url.replace(/\/$/, '')}/rest/v1/companies?select=id&limit=1`

const res = await fetch(endpoint, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
  },
})

if (!res.ok) {
  console.error(`Supabase smoke failed: HTTP ${res.status}`)
  process.exit(1)
}

const rows = await res.json()
console.log(`✓ Supabase reachable (${Array.isArray(rows) ? rows.length : 0} company row(s) sampled)`)
