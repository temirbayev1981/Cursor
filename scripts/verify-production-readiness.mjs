#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { execSync } from 'node:child_process'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

console.log(`HandymanOS AI v${pkg.version} — production readiness check\n`)

const requiredFiles = [
  'supabase/schema.sql',
  'RELEASE.md',
  'DEPLOYMENT.md',
  '.github/workflows/deploy.yml',
  '.github/workflows/ci.yml',
  'src/i18n/ai-fallbacks.ts',
  'e2e/i18n-ai-vendor.spec.ts',
  'e2e/notifications.spec.ts',
  'supabase/functions/create-checkout-session/index.ts',
  'supabase/functions/_shared/rate-limit.ts',
]

const edgeFunctions = [
  'create-checkout-session',
  'create-subscription-checkout',
  'openai-proxy',
  'send-notification',
  'send-sms',
  'stripe-webhook',
]

let ok = true

for (const file of requiredFiles) {
  if (existsSync(file)) {
    console.log(`✓ ${file}`)
  } else {
    console.log(`✗ missing: ${file}`)
    ok = false
  }
}

const functionsDir = 'supabase/functions'
if (existsSync(functionsDir)) {
  const deployed = readdirSync(functionsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name)

  console.log('\nEdge Functions:')
  for (const fn of edgeFunctions) {
    const path = `${functionsDir}/${fn}/index.ts`
    if (deployed.includes(fn) && existsSync(path)) {
      console.log(`✓ ${fn}`)
    } else {
      console.log(`✗ missing: ${path}`)
      ok = false
    }
  }
}

const schema = readFileSync('supabase/schema.sql', 'utf8')
const schemaChecks = [
  'company_members',
  'customer_reviews',
  'check_rate_limit',
  'get_accessible_companies',
  'portal_submit_review',
  'team_invites',
  'portal_tokens',
]

console.log('\nSchema objects:')
for (const token of schemaChecks) {
  if (schema.includes(token)) {
    console.log(`✓ ${token}`)
  } else {
    console.log(`✗ missing in schema.sql: ${token}`)
    ok = false
  }
}

const deployment = readFileSync('DEPLOYMENT.md', 'utf8')
const deploymentChecks = ['verify:production', 'npm run test:e2e', 'team_invites', 'openai-proxy']
console.log('\nDEPLOYMENT.md:')
for (const token of deploymentChecks) {
  if (deployment.includes(token)) {
    console.log(`✓ mentions ${token}`)
  } else {
    console.log(`✗ missing in DEPLOYMENT.md: ${token}`)
    ok = false
  }
}

console.log('\n→ Running verify:release')
execSync('npm run verify:release', { stdio: 'inherit' })

if (!ok) {
  console.error('\nProduction readiness check failed')
  process.exit(1)
}

console.log('\n✓ Production readiness check passed')
console.log('Next: configure GitHub secrets, apply schema.sql, deploy Edge Functions, merge to main')
