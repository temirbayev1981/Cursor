#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { execSync } from 'node:child_process'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

console.log(`HandymanOS AI v${pkg.version} — production readiness check\n`)

const deployWorkflow = readFileSync('.github/workflows/deploy.yml', 'utf8')

const e2eSpecs = readdirSync('e2e')
  .filter((name) => name.endsWith('.spec.ts'))
  .map((name) => `e2e/${name}`)
  .sort()

const requiredFiles = [
  'supabase/schema.sql',
  'RELEASE.md',
  'DEPLOYMENT.md',
  '.github/workflows/deploy.yml',
  '.github/workflows/ci.yml',
  '.github/workflows/supabase-smoke.yml',
  'src/i18n/ai-fallbacks.ts',
  'e2e/error-boundary.spec.ts',
  ...e2eSpecs,
  'public/manifest.json',
  'public/sw.js',
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

console.log(`E2E specs (${e2eSpecs.length}):`)
for (const file of e2eSpecs) {
  if (existsSync(file)) {
    console.log(`✓ ${file}`)
  } else {
    console.log(`✗ missing: ${file}`)
    ok = false
  }
}

console.log('')
for (const file of requiredFiles.filter((f) => !f.startsWith('e2e/'))) {
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

console.log('\nVersion sync:')
if (deployWorkflow.includes(`VITE_APP_VERSION: ${pkg.version}`)) {
  console.log(`✓ deploy.yml VITE_APP_VERSION matches package.json (${pkg.version})`)
} else {
  console.log(`✗ deploy.yml VITE_APP_VERSION must match package.json (${pkg.version})`)
  ok = false
}

console.log('\n→ Running verify:release')
execSync('npm run verify:release', { stdio: 'inherit' })

if (!ok) {
  console.error('\nProduction readiness check failed')
  process.exit(1)
}

console.log('\n✓ Production readiness check passed')
console.log('Next: configure GitHub secrets, apply schema.sql, deploy Edge Functions, merge to main')
