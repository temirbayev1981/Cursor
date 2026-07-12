#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { execSync } from 'node:child_process'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

console.log(`HandymanOS AI v${pkg.version} — production readiness check\n`)

const deployWorkflow = readFileSync('.github/workflows/deploy.yml', 'utf8')
const ciWorkflow = readFileSync('.github/workflows/ci.yml', 'utf8')

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
  'extract-pdf-text',
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
  'portal_get_notification_preferences',
  'portal_update_notification_preferences',
  'team_invites',
  'portal_tokens',
  'integration_probe_runs',
  'notification_preferences',
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

const registryFile = readFileSync('src/lib/audit-action-registry.ts', 'utf8')
const registryBlock = registryFile.match(/AUDIT_ACTION_REGISTRY = \[([\s\S]*?)\] as const/)?.[1] ?? ''
const registryKeys = [...registryBlock.matchAll(/'([^']+)'/g)].map((m) => m[1])
const missingRegistryE2e = registryKeys.filter((key) => !uniqueAuditE2eActions.has(key))
const extraE2eActions = [...uniqueAuditE2eActions].filter((key) => !registryKeys.includes(key))
if (
  registryKeys.length > 0
  && missingRegistryE2e.length === 0
  && extraE2eActions.length === 0
  && registryKeys.length === uniqueAuditE2eActions.size
) {
  console.log(`✓ audit-expanded E2E covers all ${registryKeys.length} registry keys`)
} else {
  console.log(`✗ audit-expanded must cover every AUDIT_ACTION_REGISTRY key (missing: ${missingRegistryE2e.join(', ') || 'none'}, extra: ${extraE2eActions.join(', ') || 'none'})`)
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

if (auditLabels.includes('INTEGRATION_PROBE_UI_AUDIT = true')) {
  console.log('✓ INTEGRATION_PROBE_UI_AUDIT gate enabled')
} else {
  console.log('✗ INTEGRATION_PROBE_UI_AUDIT must be true')
  ok = false
}

const integrationProbeUi = readFileSync('src/lib/integration-probe-ui.ts', 'utf8')
if (integrationProbeUi.includes('probeIntegrationsForSettings')) {
  console.log('✓ integration-probe-ui runs synthetic probes in E2E mock')
} else {
  console.log('✗ integration-probe-ui must expose probeIntegrationsForSettings')
  ok = false
}

if (auditLabels.includes('INTEGRATION_PROBE_HISTORY_AUDIT = true')) {
  console.log('✓ INTEGRATION_PROBE_HISTORY_AUDIT gate enabled')
} else {
  console.log('✗ INTEGRATION_PROBE_HISTORY_AUDIT must be true')
  ok = false
}

if (integrationProbeUi.includes('saveIntegrationProbeHistory')) {
  console.log('✗ integration-probe-ui should not own probe history persistence')
  ok = false
}

const integrationProbeHistory = readFileSync('src/lib/integration-probe-history.ts', 'utf8')
if (integrationProbeHistory.includes('saveIntegrationProbeHistory')) {
  console.log('✓ integration-probe-history persists operator probe runs')
} else {
  console.log('✗ integration-probe-history must expose saveIntegrationProbeHistory')
  ok = false
}

if (integrationProbeHistory.includes('syncIntegrationProbeHistoryToSupabase')) {
  console.log('✓ integration-probe-history syncs probe runs to Supabase')
} else {
  console.log('✗ integration-probe-history must sync probe runs to Supabase')
  ok = false
}

const inventoryService = readFileSync('src/services/inventory-service.ts', 'utf8')
if (inventoryService.includes('INVENTORY_AUDIT = true')) {
  console.log('✓ INVENTORY_AUDIT gate enabled')
} else {
  console.log('✗ INVENTORY_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('FLEET_AUDIT = true')) {
  console.log('✓ FLEET_AUDIT gate enabled')
} else {
  console.log('✗ FLEET_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('DISPATCH_AUDIT = true')) {
  console.log('✓ DISPATCH_AUDIT gate enabled')
} else {
  console.log('✗ DISPATCH_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('EXPENSE_AUDIT = true')) {
  console.log('✓ EXPENSE_AUDIT gate enabled')
} else {
  console.log('✗ EXPENSE_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('FUEL_LOG_AUDIT = true')) {
  console.log('✓ FUEL_LOG_AUDIT gate enabled')
} else {
  console.log('✗ FUEL_LOG_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('TECH_OFFLINE_SYNC_AUDIT = true')) {
  console.log('✓ TECH_OFFLINE_SYNC_AUDIT gate enabled')
} else {
  console.log('✗ TECH_OFFLINE_SYNC_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('FIELD_OPS_MILESTONE_AUDIT =')) {
  console.log('✓ FIELD_OPS_MILESTONE_AUDIT gate computed from sub-gates')
} else {
  console.log('✗ FIELD_OPS_MILESTONE_AUDIT must be computed from sub-gates')
  ok = false
}

const billingService = readFileSync('src/services/billing-service.ts', 'utf8')
if (billingService.includes('STRIPE_WEBHOOK_AUDIT = true')) {
  console.log('✓ STRIPE_WEBHOOK_AUDIT gate enabled')
} else {
  console.log('✗ STRIPE_WEBHOOK_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('AUDIT_I18N_COVERAGE = AUDIT_ACTION_COUNT >= 40')) {
  console.log('✓ AUDIT_I18N_COVERAGE gate enabled')
} else {
  console.log('✗ AUDIT_I18N_COVERAGE must derive from AUDIT_ACTION_COUNT')
  ok = false
}

if (auditLabels.includes('INTEGRATION_PROBES_AUDIT = true')) {
  console.log('✓ INTEGRATION_PROBES_AUDIT gate enabled')
} else {
  console.log('✗ INTEGRATION_PROBES_AUDIT must be true')
  ok = false
}

const onboardingService = readFileSync('src/services/onboarding-service.ts', 'utf8')
if (onboardingService.includes('ONBOARDING_AUDIT = true')) {
  console.log('✓ ONBOARDING_AUDIT gate enabled')
} else {
  console.log('✗ ONBOARDING_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('VENDOR_PO_AUDIT = true')) {
  console.log('✓ VENDOR_PO_AUDIT gate enabled')
} else {
  console.log('✗ VENDOR_PO_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('COMPANY_PROFILE_AUDIT = true')) {
  console.log('✓ COMPANY_PROFILE_AUDIT gate enabled')
} else {
  console.log('✗ COMPANY_PROFILE_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('PORTAL_AUDIT = true')) {
  console.log('✓ PORTAL_AUDIT gate enabled')
} else {
  console.log('✗ PORTAL_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('COMPANY_SWITCH_AUDIT = true')) {
  console.log('✓ COMPANY_SWITCH_AUDIT gate enabled')
} else {
  console.log('✗ COMPANY_SWITCH_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('INVITE_AUDIT = true')) {
  console.log('✓ INVITE_AUDIT gate enabled')
} else {
  console.log('✗ INVITE_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('BULK_OPS_AUDIT = true')) {
  console.log('✓ BULK_OPS_AUDIT gate enabled')
} else {
  console.log('✗ BULK_OPS_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('BILLING_PLAN_AUDIT = true')) {
  console.log('✓ BILLING_PLAN_AUDIT gate enabled')
} else {
  console.log('✗ BILLING_PLAN_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('TEAM_INVITE_AUDIT = true')) {
  console.log('✓ TEAM_INVITE_AUDIT gate enabled')
} else {
  console.log('✗ TEAM_INVITE_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('INVOICE_AUDIT = true')) {
  console.log('✓ INVOICE_AUDIT gate enabled')
} else {
  console.log('✗ INVOICE_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('SAMPLE_IMPORT_AUDIT = true')) {
  console.log('✓ SAMPLE_IMPORT_AUDIT gate enabled')
} else {
  console.log('✗ SAMPLE_IMPORT_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('PORTAL_REQUESTS_AUDIT = true')) {
  console.log('✓ PORTAL_REQUESTS_AUDIT gate enabled')
} else {
  console.log('✗ PORTAL_REQUESTS_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('ESTIMATE_CREATE_AUDIT = true')) {
  console.log('✓ ESTIMATE_CREATE_AUDIT gate enabled')
} else {
  console.log('✗ ESTIMATE_CREATE_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('ENTITY_UPDATE_AUDIT = true')) {
  console.log('✓ ENTITY_UPDATE_AUDIT gate enabled')
} else {
  console.log('✗ ENTITY_UPDATE_AUDIT must be true')
  ok = false
}

const techOfflineE2e = readFileSync('e2e/tech-offline.spec.ts', 'utf8')
if (techOfflineE2e.includes('saving job notes offline queues action and syncs when online')) {
  console.log('✓ technician offline sync E2E coverage present')
} else {
  console.log('✗ technician offline sync E2E test required')
  ok = false
}

if (auditExpanded.includes('inventory receive appears in audit log') && auditExpanded.includes('inventory apply appears in audit log')) {
  console.log('✓ inventory audit log E2E coverage present')
} else {
  console.log('✗ inventory audit log E2E tests required')
  ok = false
}

if (auditExpanded.includes('expense create appears in audit log') && auditExpanded.includes('fuel log create appears in audit log')) {
  console.log('✓ expense and fuel log audit E2E coverage present')
} else {
  console.log('✗ expense and fuel log audit E2E tests required')
  ok = false
}

if (auditExpanded.includes('onboarding complete appears in audit log') && auditExpanded.includes('vendor PO to job appears in audit log')) {
  console.log('✓ onboarding and vendor PO audit E2E coverage present')
} else {
  console.log('✗ onboarding and vendor PO audit E2E tests required')
  ok = false
}

if (auditExpanded.includes('company profile update appears in audit log') && auditExpanded.includes('portal estimate approve appears in audit log')) {
  console.log('✓ company profile and portal audit E2E coverage present')
} else {
  console.log('✗ company profile and portal audit E2E tests required')
  ok = false
}

if (auditExpanded.includes('company switch appears in audit log') && auditExpanded.includes('invite accept appears in audit log') && auditExpanded.includes('bulk cancel appears in audit log')) {
  console.log('✓ company switch, invite, and bulk ops audit E2E coverage present')
} else {
  console.log('✗ company switch, invite, and bulk ops audit E2E tests required')
  ok = false
}

if (auditExpanded.includes('billing plan upgrade appears in audit log') && auditExpanded.includes('team invite sent appears in audit log') && auditExpanded.includes('invoice payment appears in audit log')) {
  console.log('✓ billing, team invite, and invoice audit E2E coverage present')
} else {
  console.log('✗ billing, team invite, and invoice audit E2E tests required')
  ok = false
}

if (
  auditExpanded.includes('sample import appears in audit log')
  && auditExpanded.includes('portal job submit appears in audit log')
  && auditExpanded.includes('estimate created from job')
  && auditExpanded.includes('customer update appears in audit log')
) {
  console.log('✓ sample import, portal requests, estimate create, and entity update audit E2E coverage present')
} else {
  console.log('✗ sample import, portal requests, estimate create, and entity update audit E2E tests required')
  ok = false
}

if (auditLabels.includes('NOTIFICATION_HUB_AUDIT = true')) {
  console.log('✓ NOTIFICATION_HUB_AUDIT gate enabled')
} else {
  console.log('✗ NOTIFICATION_HUB_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('PORTAL_NOTIFICATION_PREFS_AUDIT = true')) {
  console.log('✓ PORTAL_NOTIFICATION_PREFS_AUDIT gate enabled')
} else {
  console.log('✗ PORTAL_NOTIFICATION_PREFS_AUDIT must be true')
  ok = false
}

const portalDataService = readFileSync('src/services/portal-data-service.ts', 'utf8')
if (portalDataService.includes('portalUpdateNotificationPreferences')) {
  console.log('✓ portal-data-service syncs notification preferences via RPC')
} else {
  console.log('✗ portal-data-service must expose portal notification preference RPCs')
  ok = false
}

if (auditLabels.includes('NOTIFICATION_OPT_OUT_AUDIT = true')) {
  console.log('✓ NOTIFICATION_OPT_OUT_AUDIT gate enabled')
} else {
  console.log('✗ NOTIFICATION_OPT_OUT_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('STAFF_CUSTOMER_NOTIFY_AUDIT = true')) {
  console.log('✓ STAFF_CUSTOMER_NOTIFY_AUDIT gate enabled')
} else {
  console.log('✗ STAFF_CUSTOMER_NOTIFY_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('NOTIFY_SKIPPED_TOAST_AUDIT = true')) {
  console.log('✓ NOTIFY_SKIPPED_TOAST_AUDIT gate enabled')
} else {
  console.log('✗ NOTIFY_SKIPPED_TOAST_AUDIT must be true')
  ok = false
}

const customerNotifySyncSpec = readFileSync('e2e/customer-notify-sync.spec.ts', 'utf8')
if (customerNotifySyncSpec.includes('staff CRM email opt-out syncs to customer portal')) {
  console.log('✓ customer-notify-sync E2E covers CRM → portal prefs')
} else {
  console.log('✗ customer-notify-sync E2E must cover CRM → portal prefs')
  ok = false
}

if (customerNotifySyncSpec.includes('portal email opt-out syncs to staff CRM')) {
  console.log('✓ customer-notify-sync E2E covers portal → staff prefs')
} else {
  console.log('✗ customer-notify-sync E2E must cover portal → staff prefs')
  ok = false
}

if (auditLabels.includes('PORTAL_STAFF_NOTIFY_SYNC_AUDIT = true')) {
  console.log('✓ PORTAL_STAFF_NOTIFY_SYNC_AUDIT gate enabled')
} else {
  console.log('✗ PORTAL_STAFF_NOTIFY_SYNC_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('NOTIFICATION_HUB_SKIP_LOG_AUDIT = true')) {
  console.log('✓ NOTIFICATION_HUB_SKIP_LOG_AUDIT gate enabled')
} else {
  console.log('✗ NOTIFICATION_HUB_SKIP_LOG_AUDIT must be true')
  ok = false
}

const skipLogModule = readFileSync('src/lib/notification-skip-log.ts', 'utf8')
if (skipLogModule.includes('recordNotificationSkip') && skipLogModule.includes('handymanos_notification_skip_log')) {
  console.log('✓ notification-skip-log module persists opt-out skips')
} else {
  console.log('✗ notification-skip-log module must persist opt-out skips')
  ok = false
}

if (skipLogModule.includes('getNotificationSkipLogStats')) {
  console.log('✓ notification skip log exposes email/SMS stats')
} else {
  console.log('✗ notification skip log must expose email/SMS stats')
  ok = false
}

if (skipLogModule.includes('exportNotificationSkipLogCsv') && skipLogModule.includes('# summary:')) {
  console.log('✓ notification skip log CSV includes email/SMS summary')
} else {
  console.log('✗ notification skip log CSV must include email/SMS summary')
  ok = false
}

const hubPanel = readFileSync('src/components/settings/notification-hub-panel.tsx', 'utf8')
if (hubPanel.includes('notification-hub-filter-skipped') && hubPanel.includes('getNotificationSkipLog')) {
  console.log('✓ notification hub exposes skipped filter tab')
} else {
  console.log('✗ notification hub must expose skipped filter tab')
  ok = false
}

if (hubPanel.includes('notification-hub-export-skip-log') && hubPanel.includes('exportNotificationSkipLogCsv')) {
  console.log('✓ notification hub exports skip log CSV')
} else {
  console.log('✗ notification hub must export skip log CSV')
  ok = false
}

if (hubPanel.includes('notification-hub-summary') && hubPanel.includes('getNotificationSkipLogStats')) {
  console.log('✓ notification hub summary shows skip breakdown')
} else {
  console.log('✗ notification hub summary must show skip breakdown')
  ok = false
}

if (hubPanel.includes('getNotificationSkipLogFiltered')) {
  console.log('✓ notification hub filters skip log by channel')
} else {
  console.log('✗ notification hub must filter skip log by channel')
  ok = false
}

if (auditLabels.includes('NOTIFICATION_HUB_SKIP_OPS_AUDIT = true')) {
  console.log('✓ NOTIFICATION_HUB_SKIP_OPS_AUDIT gate enabled')
} else {
  console.log('✗ NOTIFICATION_HUB_SKIP_OPS_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('CUSTOMER_SMS_OPT_OUT_AUDIT = true')) {
  console.log('✓ CUSTOMER_SMS_OPT_OUT_AUDIT gate enabled')
} else {
  console.log('✗ CUSTOMER_SMS_OPT_OUT_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('SCHEDULING_CUSTOMER_SMS_AUDIT = true')) {
  console.log('✓ SCHEDULING_CUSTOMER_SMS_AUDIT gate enabled')
} else {
  console.log('✗ SCHEDULING_CUSTOMER_SMS_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('ESTIMATE_INVOICE_SMS_AUDIT = true')) {
  console.log('✓ ESTIMATE_INVOICE_SMS_AUDIT gate enabled')
} else {
  console.log('✗ ESTIMATE_INVOICE_SMS_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('DISPATCH_ETA_SMS_AUDIT = true')) {
  console.log('✓ DISPATCH_ETA_SMS_AUDIT gate enabled')
} else {
  console.log('✗ DISPATCH_ETA_SMS_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('PORTAL_SMS_NOTIFY_SYNC_AUDIT = true')) {
  console.log('✓ PORTAL_SMS_NOTIFY_SYNC_AUDIT gate enabled')
} else {
  console.log('✗ PORTAL_SMS_NOTIFY_SYNC_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('NOTIFICATION_HUB_ESTIMATE_INVOICE_SMS_SKIP_AUDIT = true')) {
  console.log('✓ NOTIFICATION_HUB_ESTIMATE_INVOICE_SMS_SKIP_AUDIT gate enabled')
} else {
  console.log('✗ NOTIFICATION_HUB_ESTIMATE_INVOICE_SMS_SKIP_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('STAFF_CUSTOMER_SMS_BADGE_AUDIT = true')) {
  console.log('✓ STAFF_CUSTOMER_SMS_BADGE_AUDIT gate enabled')
} else {
  console.log('✗ STAFF_CUSTOMER_SMS_BADGE_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('NOTIFICATION_HUB_ETA_SMS_SKIP_AUDIT = true')) {
  console.log('✓ NOTIFICATION_HUB_ETA_SMS_SKIP_AUDIT gate enabled')
} else {
  console.log('✗ NOTIFICATION_HUB_ETA_SMS_SKIP_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('PORTAL_SMS_OPT_OUT_BADGE_AUDIT = true')) {
  console.log('✓ PORTAL_SMS_OPT_OUT_BADGE_AUDIT gate enabled')
} else {
  console.log('✗ PORTAL_SMS_OPT_OUT_BADGE_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('NOTIFICATION_HUB_SCHEDULING_SMS_SKIP_AUDIT = true')) {
  console.log('✓ NOTIFICATION_HUB_SCHEDULING_SMS_SKIP_AUDIT gate enabled')
} else {
  console.log('✗ NOTIFICATION_HUB_SCHEDULING_SMS_SKIP_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('PORTAL_EMAIL_OPT_OUT_BADGE_AUDIT = true')) {
  console.log('✓ PORTAL_EMAIL_OPT_OUT_BADGE_AUDIT gate enabled')
} else {
  console.log('✗ PORTAL_EMAIL_OPT_OUT_BADGE_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('NOTIFICATION_HUB_SMS_SKIP_CSV_AUDIT = true')) {
  console.log('✓ NOTIFICATION_HUB_SMS_SKIP_CSV_AUDIT gate enabled')
} else {
  console.log('✗ NOTIFICATION_HUB_SMS_SKIP_CSV_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('NOTIFICATION_HUB_SKIP_SUMMARY_AUDIT = true')) {
  console.log('✓ NOTIFICATION_HUB_SKIP_SUMMARY_AUDIT gate enabled')
} else {
  console.log('✗ NOTIFICATION_HUB_SKIP_SUMMARY_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('NOTIFICATION_HUB_DISPATCH_EMAIL_SKIP_AUDIT = true')) {
  console.log('✓ NOTIFICATION_HUB_DISPATCH_EMAIL_SKIP_AUDIT gate enabled')
} else {
  console.log('✗ NOTIFICATION_HUB_DISPATCH_EMAIL_SKIP_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('NOTIFICATION_HUB_SCHEDULING_EMAIL_SKIP_AUDIT = true')) {
  console.log('✓ NOTIFICATION_HUB_SCHEDULING_EMAIL_SKIP_AUDIT gate enabled')
} else {
  console.log('✗ NOTIFICATION_HUB_SCHEDULING_EMAIL_SKIP_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('NOTIFICATION_HUB_ETA_EMAIL_SKIP_AUDIT = true')) {
  console.log('✓ NOTIFICATION_HUB_ETA_EMAIL_SKIP_AUDIT gate enabled')
} else {
  console.log('✗ NOTIFICATION_HUB_ETA_EMAIL_SKIP_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('NOTIFICATION_HUB_INVOICE_EMAIL_SKIP_AUDIT = true')) {
  console.log('✓ NOTIFICATION_HUB_INVOICE_EMAIL_SKIP_AUDIT gate enabled')
} else {
  console.log('✗ NOTIFICATION_HUB_INVOICE_EMAIL_SKIP_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('NOTIFICATION_MILESTONE_AUDIT = true')) {
  console.log('✓ NOTIFICATION_MILESTONE_AUDIT gate enabled')
} else {
  console.log('✗ NOTIFICATION_MILESTONE_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('NOTIFICATION_HUB_SKIP_CHANNEL_FILTER_AUDIT = true')) {
  console.log('✓ NOTIFICATION_HUB_SKIP_CHANNEL_FILTER_AUDIT gate enabled')
} else {
  console.log('✗ NOTIFICATION_HUB_SKIP_CHANNEL_FILTER_AUDIT must be true')
  ok = false
}

if (auditLabels.includes('NOTIFICATION_HUB_EMAIL_SKIP_CSV_AUDIT = true')) {
  console.log('✓ NOTIFICATION_HUB_EMAIL_SKIP_CSV_AUDIT gate enabled')
} else {
  console.log('✗ NOTIFICATION_HUB_EMAIL_SKIP_CSV_AUDIT must be true')
  ok = false
}

const notificationGateCount = (auditLabels.match(/export const NOTIFICATION_\w+_AUDIT = true/g) ?? []).length
if (notificationGateCount >= 16) {
  console.log(`✓ ${notificationGateCount} notification audit gates enabled`)
} else {
  console.log(`✗ expected at least 16 notification audit gates, found ${notificationGateCount}`)
  ok = false
}

const notificationsE2e = readFileSync('e2e/notifications.spec.ts', 'utf8')
if (notificationsE2e.includes('scheduling skips customer SMS when opted out') && notificationsE2e.includes('scheduling queues customer SMS when enabled')) {
  console.log('✓ scheduling customer SMS E2E coverage present')
} else {
  console.log('✗ scheduling customer SMS E2E tests required')
  ok = false
}

const estimatesE2e = readFileSync('e2e/estimates-invoices.spec.ts', 'utf8')
if (estimatesE2e.includes('send draft estimate skips customer SMS when opted out')) {
  console.log('✓ estimate SMS opt-out E2E coverage present')
} else {
  console.log('✗ estimate SMS opt-out E2E test required')
  ok = false
}

const dispatchE2e = readFileSync('e2e/dispatch-notifications.spec.ts', 'utf8')
if (dispatchE2e.includes('skips customer ETA SMS when opted out') && dispatchE2e.includes('queues customer ETA SMS when enabled')) {
  console.log('✓ dispatch ETA SMS E2E coverage present')
} else {
  console.log('✗ dispatch ETA SMS E2E tests required')
  ok = false
}

const invoiceE2e = readFileSync('e2e/vendor-search-ai-invoice.spec.ts', 'utf8')
if (invoiceE2e.includes('send draft invoice queues customer SMS when enabled')) {
  console.log('✓ invoice SMS queue E2E coverage present')
} else {
  console.log('✗ invoice SMS queue E2E test required')
  ok = false
}

const notifySyncE2e = readFileSync('e2e/customer-notify-sync.spec.ts', 'utf8')
if (notifySyncE2e.includes('staff CRM SMS opt-out syncs to customer portal') && notifySyncE2e.includes('portal SMS opt-out syncs to staff CRM')) {
  console.log('✓ portal SMS notify sync E2E coverage present')
} else {
  console.log('✗ portal SMS notify sync E2E tests required')
  ok = false
}

const settingsE2e = readFileSync('e2e/settings-dashboard.spec.ts', 'utf8')
if (settingsE2e.includes('notification hub shows estimate SMS opt-out skip') && settingsE2e.includes('notification hub shows invoice SMS opt-out skip')) {
  console.log('✓ hub estimate/invoice SMS skip E2E coverage present')
} else {
  console.log('✗ hub estimate/invoice SMS skip E2E tests required')
  ok = false
}
if (settingsE2e.includes('notification hub shows dispatch ETA SMS opt-out skip')) {
  console.log('✓ hub dispatch ETA SMS skip E2E coverage present')
} else {
  console.log('✗ hub dispatch ETA SMS skip E2E test required')
  ok = false
}
if (settingsE2e.includes('notification hub shows scheduling SMS opt-out skip')) {
  console.log('✓ hub scheduling SMS skip E2E coverage present')
} else {
  console.log('✗ hub scheduling SMS skip E2E test required')
  ok = false
}

if (notifySyncE2e.includes('customer-portal-email-optout-badge') && notifySyncE2e.includes('customer-portal-sms-optout-badge')) {
  console.log('✓ portal email/SMS opt-out badge sync E2E coverage present')
} else {
  console.log('✗ portal email/SMS opt-out badge sync E2E required')
  ok = false
}

if (settingsE2e.includes('notification hub exports SMS skip log CSV with channel column')) {
  console.log('✓ hub SMS skip CSV export E2E coverage present')
} else {
  console.log('✗ hub SMS skip CSV export E2E test required')
  ok = false
}

if (settingsE2e.includes('notification hub exports email skip log CSV with channel column')) {
  console.log('✓ hub email skip CSV export E2E coverage present')
} else {
  console.log('✗ hub email skip CSV export E2E test required')
  ok = false
}

if (settingsE2e.includes('notification hub skip summary shows email and SMS counts')) {
  console.log('✓ hub skip summary breakdown E2E coverage present')
} else {
  console.log('✗ hub skip summary breakdown E2E test required')
  ok = false
}

if (settingsE2e.includes('notification hub shows dispatch scheduled email opt-out skip')) {
  console.log('✓ hub dispatch email skip E2E coverage present')
} else {
  console.log('✗ hub dispatch email skip E2E test required')
  ok = false
}

if (settingsE2e.includes('notification hub shows scheduling email opt-out skip')) {
  console.log('✓ hub scheduling email skip E2E coverage present')
} else {
  console.log('✗ hub scheduling email skip E2E test required')
  ok = false
}

if (settingsE2e.includes('notification hub shows dispatch ETA email opt-out skip')) {
  console.log('✓ hub dispatch ETA email skip E2E coverage present')
} else {
  console.log('✗ hub dispatch ETA email skip E2E test required')
  ok = false
}

if (settingsE2e.includes('notification hub shows invoice email opt-out skip')) {
  console.log('✓ hub invoice email skip E2E coverage present')
} else {
  console.log('✗ hub invoice email skip E2E test required')
  ok = false
}

if (settingsE2e.includes('platform-audit-check-notification_milestone_audit')) {
  console.log('✓ notification milestone audit E2E coverage present')
} else {
  console.log('✗ notification milestone audit E2E visibility required')
  ok = false
}

if (
  settingsE2e.includes('platform-audit-check-inventory_audit')
  && settingsE2e.includes('platform-audit-check-fleet_audit')
  && settingsE2e.includes('platform-audit-check-expense_audit')
  && settingsE2e.includes('platform-audit-check-fuel_log_audit')
  && settingsE2e.includes('platform-audit-check-dispatch_audit')
  && settingsE2e.includes('platform-audit-check-tech_offline_sync_audit')
  && settingsE2e.includes('platform-audit-check-field_ops_milestone_audit')
) {
  console.log('✓ core field-ops audit E2E coverage present')
} else {
  console.log('✗ core field-ops audit E2E visibility required')
  ok = false
}

if (
  settingsE2e.includes('platform-audit-check-stripe_webhook_audit')
  && settingsE2e.includes('platform-audit-check-audit_i18n')
  && settingsE2e.includes('platform-audit-check-onboarding_audit')
  && settingsE2e.includes('platform-audit-check-vendor_po_audit')
  && settingsE2e.includes('platform-audit-check-company_profile_audit')
  && settingsE2e.includes('platform-audit-check-portal_audit')
  && settingsE2e.includes('platform-audit-check-company_switch_audit')
  && settingsE2e.includes('platform-audit-check-invite_audit')
  && settingsE2e.includes('platform-audit-check-bulk_ops_audit')
  && settingsE2e.includes('platform-audit-check-billing_plan_audit')
  && settingsE2e.includes('platform-audit-check-team_invite_audit')
  && settingsE2e.includes('platform-audit-check-invoice_audit')
  && settingsE2e.includes('platform-audit-check-sample_import_audit')
  && settingsE2e.includes('platform-audit-check-portal_requests_audit')
  && settingsE2e.includes('platform-audit-check-estimate_create_audit')
  && settingsE2e.includes('platform-audit-check-entity_update_audit')
) {
  console.log('✓ platform ops audit E2E coverage present')
} else {
  console.log('✗ platform ops audit E2E visibility required')
  ok = false
}

if (settingsE2e.includes('notification hub filters skipped email and sms by channel tab')) {
  console.log('✓ hub skip channel filter E2E coverage present')
} else {
  console.log('✗ hub skip channel filter E2E test required')
  ok = false
}

const portalsE2e = readFileSync('e2e/portals.spec.ts', 'utf8')
if (portalsE2e.includes('customer-portal-sms-optout-badge') && portalsE2e.includes('customer portal shows SMS opt-out badge')) {
  console.log('✓ portal SMS opt-out badge E2E coverage present')
} else {
  console.log('✗ portal SMS opt-out badge E2E test required')
  ok = false
}

const customerPortalPage = readFileSync('src/pages/customer-portal.tsx', 'utf8')
if (customerPortalPage.includes('customer-portal-sms-optout-badge') && customerPortalPage.includes('customer-portal-email-optout-badge')) {
  console.log('✓ customer portal exposes SMS and email opt-out badges')
} else {
  console.log('✗ customer portal must expose SMS and email opt-out badges')
  ok = false
}

const jobsCustomersE2e = readFileSync('e2e/jobs-customers.spec.ts', 'utf8')
if (jobsCustomersE2e.includes('customer-sms-optout') && jobsCustomersE2e.includes('customers table shows SMS opt-out badge')) {
  console.log('✓ staff CRM SMS opt-out badge E2E coverage present')
} else {
  console.log('✗ staff CRM SMS opt-out badge E2E tests required')
  ok = false
}

const customersPage = readFileSync('src/pages/customers.tsx', 'utf8')
if (customersPage.includes('customer-sms-optout') && customersPage.includes("customerAllowsNotification(customer.id, 'sms'")) {
  console.log('✓ customers table exposes SMS opt-out badge')
} else {
  console.log('✗ customers table must expose SMS opt-out badge')
  ok = false
}

const customerForm = readFileSync('src/components/forms/customer-form.tsx', 'utf8')
if (customerForm.includes('customer-form-notify-email') && customerForm.includes('notification_preferences')) {
  console.log('✓ customer form exposes notification preference toggles')
} else {
  console.log('✗ customer form must expose notification preference toggles')
  ok = false
}

const notificationService = readFileSync('src/services/notification-service.ts', 'utf8')
if (notificationService.includes('notifyCustomerJobScheduledSms') && notificationService.includes('skipCustomerSms')) {
  console.log('✓ notification-service applies SMS opt-out for customer notifications')
} else {
  console.log('✗ notification-service must apply SMS opt-out for customer notifications')
  ok = false
}
if (notificationService.includes('notifyEstimateSentSms') && notificationService.includes('notifyInvoiceSentSms')) {
  console.log('✓ notification-service sends estimate and invoice SMS with opt-out')
} else {
  console.log('✗ notification-service must send estimate and invoice SMS with opt-out')
  ok = false
}
if (notificationService.includes('result.skipped')) {
  console.log('✓ notifyResultMessage handles skipped notifications')
} else {
  console.log('✗ notifyResultMessage must handle skipped notifications')
  ok = false
}

if (notificationService.includes('customerAllowsNotification') && notificationService.includes('notifyEstimateSent')) {
  const estimateOptOut = notificationService.includes('notifyEstimateSent(')
    && notificationService.split('notifyEstimateSent')[1]?.includes('customerAllowsNotification')
  if (estimateOptOut) {
    console.log('✓ notification-service applies opt-out to estimate and invoice sends')
  } else {
    console.log('✗ notification-service must apply opt-out to estimate sends')
    ok = false
  }
} else {
  console.log('✗ notification-service must apply customer opt-out')
  ok = false
}

if (notificationService.includes('getNotificationQueueFiltered') && notificationService.includes('retryFailedNotifications')) {
  console.log('✓ notification-service exposes hub filter and retry')
} else {
  console.log('✗ notification-service must expose hub filter and retry')
  ok = false
}

const changelog = readFileSync('CHANGELOG.md', 'utf8')
if (changelog.includes(`[${pkg.version}]`)) {
  console.log(`✓ CHANGELOG.md has [${pkg.version}] entry`)
} else {
  console.log(`✗ CHANGELOG.md must include [${pkg.version}] entry`)
  ok = false
}

console.log('\nBundle & registry:')
const pdfExtract = readFileSync('src/lib/pdf-extract.ts', 'utf8')
if (
  pdfExtract.includes("import * as pdfjsLib from 'pdfjs-dist'")
  || pdfExtract.includes("import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'")
  || (pdfExtract.includes("import('pdfjs-dist/legacy/build/pdf.mjs')") && !pdfExtract.includes("import * as pdfjsLib"))
) {
  console.log('✓ pdf-extract loads pdfjs (static import or lazy on demand)')
} else {
  console.log('✗ pdf-extract must import pdfjs-dist')
  ok = false
}

if (existsSync('supabase/functions/extract-pdf-text/index.ts')) {
  console.log('✓ extract-pdf-text edge function for iOS PDF fallback')
} else {
  console.log('✗ extract-pdf-text edge function required')
  ok = false
}

const openaiProxy = existsSync('supabase/functions/openai-proxy/index.ts')
  ? readFileSync('supabase/functions/openai-proxy/index.ts', 'utf8')
  : ''
if (openaiProxy.includes('extractPdf')) {
  console.log('✗ openai-proxy must not bundle pdf.js (extractPdf removed — use extract-pdf-text)')
  ok = false
} else {
  console.log('✓ openai-proxy stays lightweight (no pdf.js bundle)')
}

const extractPdfFn = existsSync('supabase/functions/extract-pdf-text/index.ts')
  ? readFileSync('supabase/functions/extract-pdf-text/index.ts', 'utf8')
  : ''
const sharedPdfExtract = existsSync('supabase/functions/_shared/pdf-extract.ts')
  ? readFileSync('supabase/functions/_shared/pdf-extract.ts', 'utf8')
  : ''
if (extractPdfFn && sharedPdfExtract.includes('extractTextFromPdfWithOpenAI') && !sharedPdfExtract.includes('pdfjs-dist')) {
  console.log('✓ extract-pdf-text uses OpenAI-only PDF extract (no pdf.js)')
} else {
  console.log('✗ extract-pdf-text must use OpenAI-only shared pdf-extract (no pdfjs-dist)')
  ok = false
}

if (openaiProxy.includes('images')) {
  console.log('✓ openai-proxy supports vision images for PDF OCR')
} else {
  console.log('✗ openai-proxy must accept images[] for OCR')
  ok = false
}

if (pdfExtract.includes('extractTextFromPdfCdn') && pdfExtract.includes('canExtractPdfOnServer')) {
  console.log('✓ pdf-extract mobile fallback chain (server → CDN → bundled)')
} else {
  console.log('✗ pdf-extract must use server and CDN fallback on mobile')
  ok = false
}

if (existsSync('src/lib/pdf-extract-cdn.ts')) {
  console.log('✓ pdf-extract-cdn.ts for iOS Safari CDN pdf.js fallback')
} else {
  console.log('✗ pdf-extract-cdn.ts required for iOS CDN fallback')
  ok = false
}

if (existsSync('.github/workflows/deploy-edge-functions.yml')) {
  console.log('✓ deploy-edge-functions workflow for Supabase functions')
} else {
  console.log('✗ deploy-edge-functions.yml workflow required')
  ok = false
}

const exportLib = readFileSync('src/lib/export.ts', 'utf8')
if (exportLib.includes("import('xlsx')") && !exportLib.includes("import * as XLSX from 'xlsx'")) {
  console.log('✓ export.ts lazy-loads xlsx on demand')
} else {
  console.log('✗ export.ts must dynamic-import xlsx')
  ok = false
}

if (existsSync('src/lib/audit-action-registry.ts')) {
  const registry = readFileSync('src/lib/audit-action-registry.ts', 'utf8')
  if (registry.includes('AUDIT_ACTION_REGISTRY') && auditLabels.includes("from '@/lib/audit-action-registry'")) {
    console.log('✓ audit-action-registry is single source of truth')
  } else {
    console.log('✗ audit-labels must import AUDIT_ACTION_REGISTRY')
    ok = false
  }
} else {
  console.log('✗ src/lib/audit-action-registry.ts required')
  ok = false
}

const chartPrefetch = existsSync('src/lib/chart-prefetch.ts')
  ? readFileSync('src/lib/chart-prefetch.ts', 'utf8')
  : ''
const appLayout = readFileSync('src/components/layout/app-layout.tsx', 'utf8')
const dashboardPage = readFileSync('src/pages/dashboard.tsx', 'utf8')
const reportsPage = readFileSync('src/pages/reports.tsx', 'utf8')
const lazyDashboardCharts = existsSync('src/components/charts/lazy-dashboard-charts.tsx')
  ? readFileSync('src/components/charts/lazy-dashboard-charts.tsx', 'utf8')
  : ''
const lazyReportsCharts = existsSync('src/components/charts/lazy-reports-charts.tsx')
  ? readFileSync('src/components/charts/lazy-reports-charts.tsx', 'utf8')
  : ''

if (
  chartPrefetch.includes("import('@/components/charts/dashboard-charts')")
  && chartPrefetch.includes("import('@/components/charts/reports-recharts')")
  && chartPrefetch.includes('pathname')
  && appLayout.includes('prefetchChartBundles(location.pathname)')
) {
  console.log('✓ chart bundles prefetch on dashboard/reports routes')
} else {
  console.log('✗ app layout must prefetch lazy chart chunks on dashboard/reports')
  ok = false
}

if (
  !dashboardPage.includes("from 'recharts'")
  && !reportsPage.includes("from 'recharts'")
  && lazyDashboardCharts.includes('lazy(')
  && lazyReportsCharts.includes('lazy(')
) {
  console.log('✓ dashboard and reports lazy-load recharts chunks')
} else {
  console.log('✗ pages must use lazy chart components instead of direct recharts imports')
  ok = false
}

const livePlaywright = existsSync('playwright.live.config.ts')
  ? readFileSync('playwright.live.config.ts', 'utf8')
  : ''
const liveE2e = existsSync('e2e/live-backend-smoke.spec.ts')
  ? readFileSync('e2e/live-backend-smoke.spec.ts', 'utf8')
  : ''
const nightlyLiveE2e = existsSync('.github/workflows/nightly-live-e2e.yml')
  ? readFileSync('.github/workflows/nightly-live-e2e.yml', 'utf8')
  : ''

if (
  (livePlaywright.includes("testMatch: 'live-backend-smoke.spec.ts'")
    || livePlaywright.includes("'live-backend-smoke.spec.ts'"))
  && livePlaywright.includes('stripe-live.spec.ts')
  && !livePlaywright.includes('VITE_E2E_MOCK_BACKEND')
  && liveE2e.includes('Live backend smoke')
  && nightlyLiveE2e.includes('LIVE_E2E_OPTIONAL')
) {
  console.log('✓ live-backend E2E smoke configured')
} else {
  console.log('✗ playwright.live.config.ts and live-backend-smoke E2E required')
  ok = false
}

if (nightlyLiveE2e.includes('schedule:') && nightlyLiveE2e.includes("cron: '0 7 * * *'")) {
  console.log('✓ nightly live E2E schedule configured')
} else {
  console.log('✗ nightly-live-e2e.yml must include daily cron schedule')
  ok = false
}

console.log('\nCI workflows:')
if (ciWorkflow.includes('matrix') && ciWorkflow.includes('shard') && ciWorkflow.includes('--shard=${{ matrix.shard }}/4')) {
  console.log('✓ CI E2E sharding (4 parallel jobs) configured')
} else {
  console.log('✗ ci.yml must shard Playwright E2E across 4 matrix jobs')
  ok = false
}

if (ciWorkflow.includes('supabase-smoke') && ciWorkflow.includes('smoke:supabase')) {
  console.log('✓ CI Supabase smoke job present on main')
} else {
  console.log('✗ ci.yml must include supabase-smoke job')
  ok = false
}

if (deployWorkflow.includes('smoke:supabase') && !deployWorkflow.includes('continue-on-error')) {
  console.log('✓ deploy.yml Supabase smoke runs without continue-on-error')
} else if (deployWorkflow.includes('continue-on-error')) {
  console.log('✗ deploy.yml smoke:supabase must not use continue-on-error')
  ok = false
} else {
  console.log('✗ deploy.yml must run smoke:supabase')
  ok = false
}

const nightlySmoke = existsSync('.github/workflows/supabase-smoke.yml')
  ? readFileSync('.github/workflows/supabase-smoke.yml', 'utf8')
  : ''
if (nightlySmoke.includes('smoke:supabase') && nightlySmoke.includes('SUPABASE_SERVICE_ROLE_KEY')) {
  console.log('✓ supabase-smoke workflow runs live connectivity checks with service role')
} else {
  console.log('✗ supabase-smoke.yml must run smoke:supabase with SUPABASE_SERVICE_ROLE_KEY')
  ok = false
}

if (nightlySmoke.includes('schedule:') && nightlySmoke.includes("cron: '0 6 * * *'")) {
  console.log('✓ nightly Supabase smoke schedule configured')
} else {
  console.log('✗ supabase-smoke.yml must include daily cron schedule')
  ok = false
}

console.log('\nSupabase migrations:')
const migrationFiles = [
  'supabase/migrations/README.md',
  'supabase/migrations/20260711000001_auth_provision_owner.sql',
  'supabase/migrations/20260711000002_check_rate_limit.sql',
  'supabase/migrations/20260711000003_vendor_po_problem_description.sql',
  'supabase/migrations/20260712000001_rate_limit_buckets_rls.sql',
]
for (const file of migrationFiles) {
  if (existsSync(file)) {
    console.log(`✓ ${file}`)
  } else {
    console.log(`✗ missing: ${file}`)
    ok = false
  }
}

const supabaseModule = readFileSync('src/lib/supabase.ts', 'utf8')
if (supabaseModule.includes("from '@/lib/e2e-mock-supabase'") || supabaseModule.includes('from "@/lib/e2e-mock-supabase"')) {
  console.log('✗ src/lib/supabase.ts must not statically import e2e-mock-supabase (use dynamic import)')
  ok = false
} else if (supabaseModule.includes("import('@/lib/e2e-mock-supabase')")) {
  console.log('✓ supabase.ts uses dynamic import for E2E mock')
} else {
  console.log('✗ supabase.ts must dynamically import e2e-mock-supabase for E2E builds')
  ok = false
}

const pdfExtractModule = readFileSync('src/lib/pdf-extract.ts', 'utf8')
if (pdfExtractModule.includes("from '@/lib/pdf-ocr'") || pdfExtractModule.includes('from "@/lib/pdf-ocr"')) {
  console.log('✗ src/lib/pdf-extract.ts must not statically import pdf-ocr (use dynamic import)')
  ok = false
} else if (pdfExtractModule.includes("import('@/lib/pdf-ocr')")) {
  console.log('✓ pdf-extract.ts uses dynamic import for pdf-ocr')
} else {
  console.log('✗ pdf-extract.ts must dynamically import pdf-ocr for OCR fallback')
  ok = false
}

const entityServiceModule = readFileSync('src/services/entity-service.ts', 'utf8')
if (entityServiceModule.includes("from '@/data/mock-data'") || entityServiceModule.includes('from "@/data/mock-data"')) {
  console.log('✗ entity-service.ts must not statically import mock-data (use dynamic import in importSampleData)')
  ok = false
} else if (entityServiceModule.includes("import('@/data/mock-data')")) {
  console.log('✓ entity-service.ts uses dynamic import for sample seed data')
} else {
  console.log('✗ entity-service.ts must dynamically import mock-data for importSampleData')
  ok = false
}

if (
  entityServiceModule.includes('replaceCompanyInStore')
  && entityServiceModule.includes('replaceScopedInStore')
  && entityServiceModule.includes('replaceCompanyInStore(KEY_MAP[entity], companyId, items)')
) {
  console.log('✓ entity-service uses authoritative server cache sync')
} else {
  console.log('✗ entity-service must replace company cache on empty Supabase responses')
  ok = false
}

const workOrdersPage = existsSync('src/pages/work-orders.tsx')
  ? readFileSync('src/pages/work-orders.tsx', 'utf8')
  : ''
if (workOrdersPage.includes("from '@/lib/pdf-extract'") || workOrdersPage.includes('from "@/lib/pdf-extract"')) {
  console.log('✗ work-orders.tsx must not statically import pdf-extract (use dynamic import)')
  ok = false
} else if (workOrdersPage.includes("import('@/lib/pdf-extract')")) {
  console.log('✓ work-orders.tsx uses dynamic import for pdf-extract')
} else {
  console.log('✗ work-orders.tsx must dynamically import pdf-extract for PDF upload')
  ok = false
}

if (workOrdersPage.includes("from '@/lib/ai'") || workOrdersPage.includes('from "@/lib/ai"')) {
  console.log('✗ work-orders.tsx must not statically import ai (use dynamic import in handleAnalyze)')
  ok = false
} else if (workOrdersPage.includes("import('@/lib/ai')")) {
  console.log('✓ work-orders.tsx uses dynamic import for AI analysis')
} else {
  console.log('✗ work-orders.tsx must dynamically import ai for work order analysis')
  ok = false
}

if (existsSync('src/lib/pdf-utils.ts')) {
  console.log('✓ pdf-utils.ts (lightweight PDF helpers)')
} else {
  console.log('✗ missing src/lib/pdf-utils.ts')
  ok = false
}

const estimatesPage = existsSync('src/pages/estimates.tsx')
  ? readFileSync('src/pages/estimates.tsx', 'utf8')
  : ''
if (estimatesPage.includes("from '@/lib/ai'") || estimatesPage.includes('from "@/lib/ai"')) {
  console.log('✗ estimates.tsx must not statically import ai (use dynamic import for smart engine)')
  ok = false
} else if (estimatesPage.includes("import('@/lib/ai')")) {
  console.log('✓ estimates.tsx uses dynamic import for smart engine')
} else {
  console.log('✗ estimates.tsx must dynamically import ai for smart engine')
  ok = false
}

for (const [label, file] of [
  ['invoices.tsx', 'src/pages/invoices.tsx'],
  ['estimates.tsx', 'src/pages/estimates.tsx'],
  ['reports.tsx', 'src/pages/reports.tsx'],
  ['vendor-po-table.tsx', 'src/components/vendor-po/vendor-po-table.tsx'],
]) {
  const source = existsSync(file) ? readFileSync(file, 'utf8') : ''
  if (source.includes("from '@/lib/export'") || source.includes('from "@/lib/export"')) {
    console.log(`✗ ${label} must not statically import export (use dynamic import on export action)`)
    ok = false
  } else if (source.includes("import('@/lib/export')")) {
    console.log(`✓ ${label} uses dynamic import for export`)
  } else {
    console.log(`✗ ${label} must dynamically import export`)
    ok = false
  }
}

const aiAssistantPage = existsSync('src/pages/ai-assistant.tsx')
  ? readFileSync('src/pages/ai-assistant.tsx', 'utf8')
  : ''
if (aiAssistantPage.includes("from '@/lib/ai'") || aiAssistantPage.includes('from "@/lib/ai"')) {
  console.log('✗ ai-assistant.tsx must not statically import ai (use dynamic import on send)')
  ok = false
} else if (aiAssistantPage.includes("import('@/lib/ai')")) {
  console.log('✓ ai-assistant.tsx uses dynamic import for AI chat')
} else {
  console.log('✗ ai-assistant.tsx must dynamically import ai for chat')
  ok = false
}

if (existsSync('src/lib/vendor-po-groups.ts')) {
  console.log('✓ vendor-po-groups.ts (lightweight address grouping)')
} else {
  console.log('✗ missing src/lib/vendor-po-groups.ts')
  ok = false
}

if (existsSync('src/lib/ai-context.ts')) {
  console.log('✓ ai-context.ts (lightweight business context)')
} else {
  console.log('✗ missing src/lib/ai-context.ts')
  ok = false
}

const e2eVisibleSpecs = [
  'e2e/audit-expanded.spec.ts',
  'e2e/settings-dashboard.spec.ts',
  'e2e/tech-offline.spec.ts',
  'e2e/notifications.spec.ts',
  'e2e/dispatch-notifications.spec.ts',
  'e2e/portals.spec.ts',
]
console.log('\nE2E visibleText coverage (key specs):')
for (const file of e2eVisibleSpecs) {
  const source = existsSync(file) ? readFileSync(file, 'utf8') : ''
  if (!source.includes("from './helpers/visibility'") || !source.includes('visibleText(page,')) {
    console.log(`✗ ${file} must use visibleText helper`)
    ok = false
  } else if (source.includes('page.getByText(')) {
    console.log(`✗ ${file} must not use raw page.getByText`)
    ok = false
  } else {
    console.log(`✓ ${file}`)
  }
}

const portalService = existsSync('src/services/portal-service.ts')
  ? readFileSync('src/services/portal-service.ts', 'utf8')
  : ''
if (portalService.includes('replaceScopedInStore') && portalService.includes('listPortalTokens')) {
  console.log('✓ portal-service authoritative portal token cache sync')
} else {
  console.log('✗ portal-service must replace scoped portal tokens on empty remote')
  ok = false
}

const mobileLayoutSpecs = [
  'e2e/jobs-mobile-layout.spec.ts',
  'e2e/customers-mobile-layout.spec.ts',
  'e2e/vendor-po-mobile-layout.spec.ts',
  'e2e/invoices-mobile-layout.spec.ts',
  'e2e/estimates-mobile-layout.spec.ts',
  'e2e/materials-mobile-layout.spec.ts',
  'e2e/expenses-mobile-layout.spec.ts',
  'e2e/vehicles-mobile-layout.spec.ts',
  'e2e/reports-mobile-layout.spec.ts',
  'e2e/scheduling-mobile-layout.spec.ts',
  'e2e/properties-mobile-layout.spec.ts',
  'e2e/technicians-mobile-layout.spec.ts',
  'e2e/dispatch-mobile-layout.spec.ts',
  'e2e/dashboard-mobile-layout.spec.ts',
]
console.log('\nMobile layout E2E:')
for (const file of mobileLayoutSpecs) {
  if (existsSync(file)) {
    console.log(`✓ ${file}`)
  } else {
    console.log(`✗ missing: ${file}`)
    ok = false
  }
}

const instructionsEn = existsSync('public/INSTRUCTIONS.en.md') && existsSync('INSTRUCTIONS.en.md')
if (instructionsEn) {
  console.log('✓ bilingual user guide (INSTRUCTIONS.en.md)')
} else {
  console.log('✗ INSTRUCTIONS.en.md required in public/ and repo root')
  ok = false
}

if (existsSync('scripts/deploy-edge-functions.sh')) {
  console.log('✓ Edge Function deploy script present')
} else {
  console.log('✗ missing scripts/deploy-edge-functions.sh')
  ok = false
}

const legacyWorkflows = ['.github/workflows/static.yml', '.github/workflows/jekyll-gh-pages.yml']
for (const wf of legacyWorkflows) {
  if (existsSync(wf)) {
    console.log(`✗ legacy workflow must be removed: ${wf}`)
    ok = false
  }
}
if (!legacyWorkflows.some((wf) => existsSync(wf))) {
  console.log('✓ no legacy GitHub Pages boilerplate workflows')
}

const phase3Files = [
  'src/hooks/use-table-pagination.ts',
  'src/components/shared/table-pagination.tsx',
  'src/components/settings/settings-integrations-panel.tsx',
  'src/components/settings/settings-system-panel.tsx',
  'e2e/a11y-axe.spec.ts',
]
console.log('\nAudit phase 3:')
for (const file of phase3Files) {
  if (existsSync(file)) {
    console.log(`✓ ${file}`)
  } else {
    console.log(`✗ missing: ${file}`)
    ok = false
  }
}

const phase135Files = [
  'src/hooks/use-server-entity-table.ts',
  'src/lib/pdf-ocr.ts',
  'OPERATOR_RUNBOOK.md',
  'scripts/operator-prod-checklist.mjs',
  'e2e/mobile-smoke.spec.ts',
]
console.log('\nRoadmap phase 135:')
for (const file of phase135Files) {
  if (existsSync(file)) {
    console.log(`✓ ${file}`)
  } else {
    console.log(`✗ missing: ${file}`)
    ok = false
  }
}

const entityService = existsSync('src/services/entity-service.ts')
  ? readFileSync('src/services/entity-service.ts', 'utf8')
  : ''
if (entityService.includes('listEntitiesPage')) {
  console.log('✓ entity-service listEntitiesPage for server pagination')
} else {
  console.log('✗ entity-service must export listEntitiesPage')
  ok = false
}

const serverPaginationPages = [
  ['customers.tsx', 'src/pages/customers.tsx', 'useServerEntityTable'],
  ['jobs.tsx', 'src/pages/jobs.tsx', 'useServerEntityTable'],
  ['invoices.tsx', 'src/pages/invoices.tsx', 'useServerEntityTable'],
  ['estimates.tsx', 'src/pages/estimates.tsx', 'useServerEntityTable'],
  ['expenses.tsx', 'src/pages/expenses.tsx', 'useServerEntityTable'],
  ['materials.tsx', 'src/pages/materials.tsx', 'useServerEntityTable'],
]
console.log('\nServer pagination coverage (Phase 135 P6):')
for (const [label, file, hook] of serverPaginationPages) {
  const source = existsSync(file) ? readFileSync(file, 'utf8') : ''
  if (source.includes(hook) && !source.includes('useTablePagination(')) {
    console.log(`✓ ${label} uses ${hook}`)
  } else {
    console.log(`✗ ${label} must use ${hook} instead of client-side useTablePagination`)
    ok = false
  }
}

if (
  entityService.includes("'estimates' | 'expenses' | 'materials'")
  && entityService.includes('replaceCompanyInStore(KEY_MAP[entity], companyId, [])')
) {
  console.log('✓ listEntitiesPage clears company cache on empty unfiltered first page')
} else {
  console.log('✗ listEntitiesPage must replace company cache when remote page total is zero')
  ok = false
}

const vehiclesPage = existsSync('src/pages/vehicles.tsx')
  ? readFileSync('src/pages/vehicles.tsx', 'utf8')
  : ''
if (
  vehiclesPage.includes('useServerFuelLogsTable')
  && !vehiclesPage.includes('useTablePagination(')
  && entityService.includes('listFuelLogsPage')
) {
  console.log('✓ vehicles.tsx uses server-side fuel log pagination')
} else {
  console.log('✗ vehicles.tsx must use useServerFuelLogsTable and listFuelLogsPage')
  ok = false
}

if (existsSync('src/hooks/use-server-fuel-logs-table.ts')) {
  console.log('✓ use-server-fuel-logs-table hook present')
} else {
  console.log('✗ missing src/hooks/use-server-fuel-logs-table.ts')
  ok = false
}

const clientPaginationInPages = [
  'src/pages/customers.tsx',
  'src/pages/jobs.tsx',
  'src/pages/invoices.tsx',
  'src/pages/estimates.tsx',
  'src/pages/expenses.tsx',
  'src/pages/materials.tsx',
  'src/pages/vehicles.tsx',
].filter((file) => {
  const source = existsSync(file) ? readFileSync(file, 'utf8') : ''
  return source.includes('useTablePagination(')
})
if (clientPaginationInPages.length === 0) {
  console.log('✓ no entity pages use client-side useTablePagination')
} else {
  console.log(`✗ pages must not use client-side useTablePagination: ${clientPaginationInPages.join(', ')}`)
  ok = false
}

const auditLabelsModule = readFileSync('src/lib/audit-labels.ts', 'utf8')
if (auditLabelsModule.includes('SERVER_PAGINATION_AUDIT = true')) {
  console.log('✓ SERVER_PAGINATION_AUDIT gate enabled')
} else {
  console.log('✗ SERVER_PAGINATION_AUDIT must be true')
  ok = false
}

const platformAuditModule = existsSync('src/lib/platform-audit.ts')
  ? readFileSync('src/lib/platform-audit.ts', 'utf8')
  : ''
if (platformAuditModule.includes('server_pagination_audit') && platformAuditModule.includes('SERVER_PAGINATION_AUDIT')) {
  console.log('✓ platform-audit includes server pagination quality check')
} else {
  console.log('✗ platform-audit must include server_pagination_audit check')
  ok = false
}

if (existsSync('src/lib/audit-recommendation-links.ts')) {
  console.log('✓ audit recommendation → integration card links')
} else {
  console.log('✗ missing src/lib/audit-recommendation-links.ts')
  ok = false
}

const settingsSystemPanel = existsSync('src/components/settings/settings-system-panel.tsx')
  ? readFileSync('src/components/settings/settings-system-panel.tsx', 'utf8')
  : ''
if (settingsSystemPanel.includes('audit-recommendation-link-') && settingsSystemPanel.includes('onOpenIntegration')) {
  console.log('✓ settings system panel links audit recommendations to integrations')
} else {
  console.log('✗ settings-system-panel must link audit recommendations to integrations tab')
  ok = false
}

if (entityService.includes('getFuelLogsSummary') && entityService.includes('getExpensesSummary')) {
  console.log('✓ entity-service lightweight KPI summary queries')
} else {
  console.log('✗ entity-service must export getFuelLogsSummary and getExpensesSummary')
  ok = false
}

if (
  entityService.includes('getInvoicesSummary')
  && entityService.includes('fetchInvoiceById')
  && entityService.includes('getMaterialsSummary')
) {
  console.log('✓ entity-service invoice and materials KPI summaries')
} else {
  console.log('✗ entity-service must export getInvoicesSummary, fetchInvoiceById, and getMaterialsSummary')
  ok = false
}

if (auditLabelsModule.includes('KPI_SUMMARY_AUDIT = true')) {
  console.log('✓ KPI_SUMMARY_AUDIT gate enabled')
} else {
  console.log('✗ KPI_SUMMARY_AUDIT must be true')
  ok = false
}

if (platformAuditModule.includes('kpi_summary_audit') && platformAuditModule.includes('KPI_SUMMARY_AUDIT')) {
  console.log('✓ platform-audit includes KPI summary quality check')
} else {
  console.log('✗ platform-audit must include kpi_summary_audit check')
  ok = false
}

const invoicesPage = existsSync('src/pages/invoices.tsx')
  ? readFileSync('src/pages/invoices.tsx', 'utf8')
  : ''
if (invoicesPage.includes('useInvoicesSummary') && !invoicesPage.includes('useInvoices()')) {
  console.log('✓ invoices page uses KPI summary instead of full list')
} else {
  console.log('✗ invoices.tsx must use useInvoicesSummary without useInvoices for KPIs')
  ok = false
}

const materialsPage = existsSync('src/pages/materials.tsx')
  ? readFileSync('src/pages/materials.tsx', 'utf8')
  : ''
if (materialsPage.includes('useMaterialsSummary') && !materialsPage.includes('useMaterials()')) {
  console.log('✓ materials page uses KPI summary instead of full list')
} else {
  console.log('✗ materials.tsx must use useMaterialsSummary without useMaterials for stock alert')
  ok = false
}

if (
  entityService.includes('listCustomerContacts')
  && entityService.includes('getSmartEngineJobContext')
) {
  console.log('✓ entity-service estimates lightweight context queries')
} else {
  console.log('✗ entity-service must export listCustomerContacts and getSmartEngineJobContext')
  ok = false
}

if (auditLabelsModule.includes('ESTIMATES_LIGHTWEIGHT_AUDIT = true')) {
  console.log('✓ ESTIMATES_LIGHTWEIGHT_AUDIT gate enabled')
} else {
  console.log('✗ ESTIMATES_LIGHTWEIGHT_AUDIT must be true')
  ok = false
}

if (platformAuditModule.includes('estimates_lightweight_audit') && platformAuditModule.includes('ESTIMATES_LIGHTWEIGHT_AUDIT')) {
  console.log('✓ platform-audit includes estimates lightweight quality check')
} else {
  console.log('✗ platform-audit must include estimates_lightweight_audit check')
  ok = false
}

if (
  estimatesPage.includes('useCustomerContacts')
  && estimatesPage.includes('useSmartEngineJobContext')
  && !estimatesPage.includes('useJobs()')
  && !estimatesPage.includes('useCustomers()')
  && !estimatesPage.includes('useInvoices()')
) {
  console.log('✓ estimates page uses lightweight contacts and smart-engine context')
} else {
  console.log('✗ estimates.tsx must use useCustomerContacts/useSmartEngineJobContext without full entity lists')
  ok = false
}

const pkgJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (pkgJson.scripts?.['verify:operator:prod']) {
  console.log('✓ verify:operator:prod npm script')
} else {
  console.log('✗ package.json must define verify:operator:prod')
  ok = false
}

const integrationsPanel = existsSync('src/components/settings/settings-integrations-panel.tsx')
  ? readFileSync('src/components/settings/settings-integrations-panel.tsx', 'utf8')
  : ''
if (integrationsPanel.includes('quickbooks')) {
  console.log('✓ QuickBooks integration card registered')
} else {
  console.log('✗ settings-integrations-panel must include quickbooks')
  ok = false
}

if (pkgJson.devDependencies?.['@axe-core/playwright']) {
  console.log('✓ @axe-core/playwright dependency')
} else {
  console.log('✗ @axe-core/playwright devDependency required')
  ok = false
}

const settingsPage = existsSync('src/pages/settings.tsx')
  ? readFileSync('src/pages/settings.tsx', 'utf8')
  : ''
if (settingsPage.includes('SettingsIntegrationsPanel') && settingsPage.includes('SettingsSystemPanel')) {
  console.log('✓ settings page uses extracted panels')
} else {
  console.log('✗ settings.tsx must use SettingsIntegrationsPanel and SettingsSystemPanel')
  ok = false
}

if (liveE2e.includes('INSTRUCTIONS.en.md') && liveE2e.includes('manifest.json') && liveE2e.includes('sw.js')) {
  console.log('✓ live smoke checks static PWA/guide assets')
} else {
  console.log('✗ live-backend-smoke must verify INSTRUCTIONS.en.md, manifest.json, sw.js')
  ok = false
}

const prodSourceDirs = ['src/pages', 'src/hooks', 'src/components']
let compLeak = false
for (const dir of prodSourceDirs) {
  if (!existsSync(dir)) continue
  for (const name of readdirSync(dir, { recursive: true })) {
    if (typeof name !== 'string') continue
    if (!name.endsWith('.ts') && !name.endsWith('.tsx')) continue
    if (name.endsWith('.test.ts') || name.endsWith('.test.tsx')) continue
    const rel = `${dir}/${name}`
    const text = readFileSync(rel, 'utf8')
    if (text.includes("comp-001")) {
      console.log(`✗ comp-001 fallback leak in ${rel}`)
      compLeak = true
      ok = false
    }
  }
}
if (!compLeak) {
  console.log('✓ no comp-001 fallback in production src (pages/hooks/components)')
}

console.log('\n→ Running verify:release')
try {
  execSync('npm run verify:release', { stdio: 'inherit' })
} catch {
  ok = false
}

if (!ok) {
  console.error('\nProduction readiness check failed')
  process.exit(1)
}

console.log('\n✓ Production readiness check passed')
console.log('Next: configure GitHub secrets, apply schema.sql, deploy Edge Functions — see POST_RELEASE.md')
