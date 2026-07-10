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
  'supabase/UPGRADE.md',
  'RELEASE.md',
  'DEPLOYMENT.md',
  'MERGE.md',
  'POST_RELEASE.md',
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
const deploymentChecks = ['verify:production', 'npm run test:e2e', 'team_invites', 'openai-proxy', 'MERGE.md', 'POST_RELEASE.md', 'UPGRADE.md']
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
const usesPackageVersion =
  deployWorkflow.includes('require(\'./package.json\').version')
  || deployWorkflow.includes('package.json").version')
  || deployWorkflow.includes('VITE_APP_VERSION=$(node')
const hasHardcodedVersion = deployWorkflow.includes(`VITE_APP_VERSION: ${pkg.version}`)
if (usesPackageVersion || hasHardcodedVersion) {
  console.log(`✓ deploy.yml sets VITE_APP_VERSION from package.json (${pkg.version})`)
} else {
  console.log(`✗ deploy.yml must set VITE_APP_VERSION from package.json (${pkg.version})`)
  ok = false
}

const readme = readFileSync('README.md', 'utf8')
if (readme.includes(`**${pkg.version}**`) || readme.includes(`version:** ${pkg.version}`)) {
  console.log(`✓ README.md mentions package version (${pkg.version})`)
} else {
  console.log(`✗ README.md must mention current version (${pkg.version})`)
  ok = false
}

const auditLabels = readFileSync('src/lib/audit-labels.ts', 'utf8')
const auditExpanded = readFileSync('e2e/audit-expanded.spec.ts', 'utf8')
const actionCountMatch = auditLabels.match(/AUDIT_ACTION_COUNT\s*=\s*AUDIT_ACTION_KEYS\.size/)
const e2eFullMatch = auditLabels.includes('AUDIT_E2E_FULL_COVERAGE = true')
const auditActionRefs = [...auditExpanded.matchAll(/data-audit-action="([^"]+)"/g)].map((m) => m[1])
const uniqueAuditE2eActions = new Set(auditActionRefs)

console.log('\nAudit invariants:')
if (actionCountMatch) {
  console.log('✓ AUDIT_ACTION_COUNT derived from AUDIT_ACTION_KEYS')
} else {
  console.log('✗ AUDIT_ACTION_COUNT must use AUDIT_ACTION_KEYS.size')
  ok = false
}
if (e2eFullMatch) {
  console.log('✓ AUDIT_E2E_FULL_COVERAGE gate enabled')
} else {
  console.log('✗ AUDIT_E2E_FULL_COVERAGE must be true')
  ok = false
}
if (uniqueAuditE2eActions.size >= 40) {
  console.log(`✓ audit-expanded.spec.ts references ${uniqueAuditE2eActions.size} unique audit actions`)
} else {
  console.log(`✗ audit-expanded.spec.ts should reference many audit actions (got ${uniqueAuditE2eActions.size})`)
  ok = false
}
if (auditLabels.includes('OBSERVABILITY_PROBE_AUDIT = true')) {
  console.log('✓ OBSERVABILITY_PROBE_AUDIT gate enabled')
} else {
  console.log('✗ OBSERVABILITY_PROBE_AUDIT must be true')
  ok = false
}

const smokeScript = readFileSync('scripts/supabase-smoke.mjs', 'utf8')
const platformProbes = readFileSync('src/lib/platform-probes.ts', 'utf8')
if (smokeScript.includes('SMOKE_EDGE_FUNCTIONS')) {
  console.log('✓ supabase-smoke.mjs supports SMOKE_EDGE_FUNCTIONS')
} else {
  console.log('✗ supabase-smoke.mjs must support SMOKE_EDGE_FUNCTIONS')
  ok = false
}

if (auditLabels.includes('PWA_SW_OFFLINE_AUDIT = true')) {
  console.log('✓ PWA_SW_OFFLINE_AUDIT gate enabled')
} else {
  console.log('✗ PWA_SW_OFFLINE_AUDIT must be true')
  ok = false
}

if (platformProbes.includes('getSentryProbeUrl')) {
  console.log('✓ platform-probes uses Sentry DSN probe helper')
} else {
  console.log('✗ platform-probes must probe VITE_SENTRY_DSN via getSentryProbeUrl')
  ok = false
}

const changelog = readFileSync('CHANGELOG.md', 'utf8')
if (changelog.includes(`[${pkg.version}]`)) {
  console.log(`✓ CHANGELOG.md has [${pkg.version}] entry`)
} else {
  console.log(`✗ CHANGELOG.md must include [${pkg.version}] entry`)
  ok = false
}

console.log('\n→ Running verify:release')
execSync('npm run verify:release', { stdio: 'inherit' })

if (!ok) {
  console.error('\nProduction readiness check failed')
  process.exit(1)
}

console.log('\n✓ Production readiness check passed')
console.log('Next: configure GitHub secrets, apply schema.sql, deploy Edge Functions — see POST_RELEASE.md')
