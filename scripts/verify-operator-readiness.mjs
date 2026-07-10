#!/usr/bin/env node
/**
 * Operator readiness checklist — run after deploy or when configuring production.
 * Complements verify:production (code) with env/ops guidance.
 */
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const REQUIRED_SECRETS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
]

const RECOMMENDED_SECRETS = [
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_STRIPE_CHECKOUT_ENDPOINT',
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_NOTIFICATION_WEBHOOK_URL',
  'VITE_SMS_WEBHOOK_URL',
  'VITE_SENTRY_DSN',
  'VITE_ERROR_WEBHOOK_URL',
  'VITE_OPENAI_PROXY_ENDPOINT',
]

console.log(`HandymanOS AI v${pkg.version} — operator readiness\n`)

let ok = true

for (const key of REQUIRED_SECRETS) {
  if (process.env[key]) {
    console.log(`✓ ${key} is set`)
  } else {
    console.log(`✗ ${key} is required for live deploy`)
    ok = false
  }
}

console.log('\nRecommended secrets:')
for (const key of RECOMMENDED_SECRETS) {
  console.log(process.env[key] ? `✓ ${key}` : `○ ${key} (optional — enables integration)`)
}

const hasObservability = Boolean(process.env.VITE_SENTRY_DSN || process.env.VITE_ERROR_WEBHOOK_URL)
if (hasObservability) {
  console.log('\n✓ Observability configured')
} else {
  console.log('\n○ Observability not configured (Sentry DSN or error webhook)')
}

console.log('\n→ Running verify:production')
try {
  execSync('npm run verify:production', { stdio: 'inherit' })
} catch {
  ok = false
}

if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
  console.log('\n→ Running smoke:supabase (tables + RPCs)')
  try {
    execSync('npm run smoke:supabase', { stdio: 'inherit', env: { ...process.env, SMOKE_OPTIONAL: '0' } })
  } catch {
    console.log('✗ smoke:supabase failed — check schema.sql and Edge Functions')
    ok = false
  }

  if (process.env.SMOKE_EDGE_FUNCTIONS === '1' || process.env.CI) {
    console.log('\n→ Running edge function smoke (SMOKE_EDGE_FUNCTIONS=1)')
    try {
      execSync('npm run smoke:supabase', {
        stdio: 'inherit',
        env: { ...process.env, SMOKE_EDGE_FUNCTIONS: '1', SMOKE_OPTIONAL: '0' },
      })
    } catch {
      console.log('✗ Edge function smoke failed — redeploy supabase/functions')
      ok = false
    }
  } else {
    console.log('\n○ Set SMOKE_EDGE_FUNCTIONS=1 to probe edge functions after deploy')
  }
} else {
  console.log('\n○ Skipping live Supabase smoke — set VITE_SUPABASE_* in .env.local or GitHub Secrets')
}

console.log('\nOperator checklist:')
console.log('1. Settings → System — platform audit score ≥ 8.5')
console.log('2. Settings → Integrations — Refresh probes, verify Live badges')
console.log('3. Settings → System — review probe history, notification queue, and skipped opt-out log')
console.log('4. smoke:supabase — portal_get/update_notification_preferences RPCs')
console.log('5. POST_RELEASE.md — GitHub Secrets and Edge Function secrets')

if (!ok) {
  console.error('\nOperator readiness check failed')
  process.exit(1)
}

console.log('\n✓ Operator readiness check passed')
