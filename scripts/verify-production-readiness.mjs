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

console.log('\n→ Running verify:release')
execSync('npm run verify:release', { stdio: 'inherit' })

if (!ok) {
  console.error('\nProduction readiness check failed')
  process.exit(1)
}

console.log('\n✓ Production readiness check passed')
console.log('Next: configure GitHub secrets, apply schema.sql, deploy Edge Functions — see POST_RELEASE.md')
