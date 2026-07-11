#!/usr/bin/env node
/**
 * Production operator checklist — run after deploy to reach Platform Audit ≥ 9/10.
 * Usage: npm run verify:operator  (with VITE_SUPABASE_* in env or .env.local)
 */
import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

console.log(`\nHandymanOS AI v${pkg.version} — Operator production checklist (10/10)\n`)

const steps = [
  {
    id: 'supabase_secrets',
    label: 'GitHub Secrets: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY',
    ok: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
    hint: 'Service role key required for strict supabase-smoke (check_rate_limit RPC)',
  },
  {
    id: 'rate_limit_migration',
    label: 'SQL: supabase/migrations/20260711000002_check_rate_limit.sql applied',
    ok: existsSync('supabase/migrations/20260711000002_check_rate_limit.sql'),
    hint: 'Run in Supabase SQL Editor if supabase-smoke reports missing check_rate_limit',
  },
  {
    id: 'auth_migration',
    label: 'SQL: supabase/migrations/20260711000001_auth_provision_owner.sql applied',
    ok: existsSync('supabase/migrations/20260711000001_auth_provision_owner.sql'),
    hint: 'Run in Supabase SQL Editor if login/signup fails',
  },
  {
    id: 'edge_functions',
    label: 'Edge Functions deployed (npm run deploy:edge-functions)',
    ok: existsSync('supabase/functions/openai-proxy/index.ts'),
    hint: 'Requires Supabase CLI + project link',
  },
  {
    id: 'ftp_deploy',
    label: 'FTP secrets for handy.readyfixnc.com (FTP_HOST, FTP_USER, FTP_PASSWORD)',
    ok: Boolean(process.env.FTP_HOST || process.env.CI),
    hint: 'Set in GitHub Secrets; push to main triggers Deploy FTP',
  },
  {
    id: 'stripe',
    label: 'Stripe: VITE_STRIPE_PUBLISHABLE_KEY + webhook → stripe-webhook',
    ok: Boolean(process.env.VITE_STRIPE_PUBLISHABLE_KEY),
    hint: 'Optional — enables online payments',
  },
  {
    id: 'email',
    label: 'Email: send-notification + RESEND_API_KEY or VITE_NOTIFICATION_WEBHOOK_URL',
    ok: Boolean(process.env.VITE_NOTIFICATION_WEBHOOK_URL || process.env.VITE_SUPABASE_URL),
    hint: 'Edge Function secrets in Supabase dashboard',
  },
  {
    id: 'sms',
    label: 'SMS: send-sms + Twilio secrets or VITE_SMS_WEBHOOK_URL',
    ok: Boolean(process.env.VITE_SMS_WEBHOOK_URL || process.env.VITE_SUPABASE_URL),
    hint: 'Optional — dispatch/invoice SMS',
  },
  {
    id: 'openai',
    label: 'OpenAI: openai-proxy + OPENAI_API_KEY (PDF OCR + AI features)',
    ok: Boolean(process.env.VITE_OPENAI_PROXY_ENDPOINT || process.env.VITE_SUPABASE_URL),
    hint: 'Required for scanned Vendor PO OCR',
  },
  {
    id: 'maps',
    label: 'Google Maps: VITE_GOOGLE_MAPS_API_KEY',
    ok: Boolean(process.env.VITE_GOOGLE_MAPS_API_KEY),
    hint: 'Optional — dispatch map',
  },
  {
    id: 'sentry',
    label: 'Observability: VITE_SENTRY_DSN or VITE_ERROR_WEBHOOK_URL',
    ok: Boolean(process.env.VITE_SENTRY_DSN || process.env.VITE_ERROR_WEBHOOK_URL),
    hint: 'Optional — error monitoring',
  },
]

let requiredOk = true
for (const step of steps) {
  const icon = step.ok ? '✓' : '○'
  console.log(`${icon} ${step.label}`)
  if (!step.ok && step.hint) console.log(`    → ${step.hint}`)
  if (step.id === 'supabase_secrets' && !step.ok) requiredOk = false
}

console.log('\nIn-app verification (after deploy):')
console.log('  1. Settings → Integrations → Refresh probes (all Live)')
console.log('  2. Settings → System → Platform Audit score ≥ 9')
console.log('  3. Work Orders → Vendor PO → upload PDF (text or scan)')
console.log('  4. Customers/Jobs → table pagination loads pages from Supabase')

if (requiredOk) {
  console.log('\n→ Running verify:operator')
  try {
    execSync('npm run verify:operator', { stdio: 'inherit' })
  } catch {
    process.exit(1)
  }
} else {
  console.log('\n✗ Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then re-run')
  process.exit(1)
}

console.log('\n✓ Operator production checklist complete')
