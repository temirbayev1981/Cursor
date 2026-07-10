import { hasSupabase, isE2eMockBackend, hasObservability } from '@/lib/env'
import { computePlatformHealth, integrationProbesPass, type PlatformHealthOptions } from '@/lib/platform-health'
import { TYPED_SUPABASE_QUERIES } from '@/lib/supabase-queries'
import { hasIntegrationProbeHistory } from '@/lib/integration-probe-history'
import { integrationProbeUiReady } from '@/lib/integration-probe-ui'
import { AUDIT_E2E_FULL_COVERAGE, AUDIT_I18N_COVERAGE, BILLING_PLAN_AUDIT, BULK_OPS_AUDIT, COMPANY_PROFILE_AUDIT, COMPANY_SWITCH_AUDIT, CUSTOMER_SMS_OPT_OUT_AUDIT, DISPATCH_AUDIT, ENTITY_UPDATE_AUDIT, ESTIMATE_CREATE_AUDIT, EXPENSE_AUDIT, FLEET_AUDIT, FUEL_LOG_AUDIT, INTEGRATION_PROBES_AUDIT, INTEGRATION_PROBE_HISTORY_AUDIT, INTEGRATION_PROBE_UI_AUDIT, INVOICE_AUDIT, INVITE_AUDIT, NOTIFICATION_HUB_AUDIT, NOTIFICATION_HUB_SKIP_LOG_AUDIT, NOTIFICATION_HUB_SKIP_OPS_AUDIT, NOTIFICATION_OPT_OUT_AUDIT, NOTIFY_SKIPPED_TOAST_AUDIT, OBSERVABILITY_PROBE_AUDIT, PORTAL_AUDIT, PORTAL_NOTIFICATION_PREFS_AUDIT, PORTAL_REQUESTS_AUDIT, PORTAL_STAFF_NOTIFY_SYNC_AUDIT, PWA_SW_OFFLINE_AUDIT, SAMPLE_IMPORT_AUDIT, SCHEDULING_CUSTOMER_SMS_AUDIT, STAFF_CUSTOMER_NOTIFY_AUDIT, TEAM_INVITE_AUDIT, VENDOR_PO_AUDIT } from '@/lib/audit-labels'
import { MULTI_TENANT_SUPPORTED, MULTI_TENANT_MEMBERSHIP_RPC } from '@/services/company-service'
import { PORTAL_RPC_ENFORCED } from '@/services/portal-data-service'
import { STRIPE_WEBHOOK_AUDIT } from '@/services/billing-service'
import { INVENTORY_AUDIT } from '@/services/inventory-service'
import { ONBOARDING_AUDIT } from '@/services/onboarding-service'

export type AuditRecommendationId =
  | 'connect_supabase'
  | 'configure_stripe'
  | 'enable_email'
  | 'enable_sms'
  | 'configure_openai'
  | 'configure_maps'
  | 'offline_sync'
  | 'observability'
  | 'all_ready'

export type AuditSummaryKey = 'ready' | 'needs_config'

export interface PlatformAuditCheck {
  id: string
  label: string
  ok: boolean
  weight: number
}

export interface PlatformAuditReport {
  score: number
  grade: string
  integrationScore: number
  qualityScore: number
  checks: PlatformAuditCheck[]
  recommendationIds: AuditRecommendationId[]
  summaryKey: AuditSummaryKey
  readyForProduction: boolean
}

export function computePlatformAudit(options: PlatformHealthOptions = {}): PlatformAuditReport {
  const health = computePlatformHealth(options)
  const localeConfigured = typeof localStorage !== 'undefined'
    && Boolean(localStorage.getItem('handymanos_locale'))

  const liveBackend = hasSupabase && !isE2eMockBackend
  const probesOk = integrationProbesPass(options.probeResults)
  const probeUiReady = integrationProbeUiReady(options.probeResults)
  const probeHistoryReady = options.probeHistoryReady ?? hasIntegrationProbeHistory()
  const observabilityProbeOk = !hasObservability || options.probeResults?.observability !== false

  const qualityChecks: PlatformAuditCheck[] = [
    { id: 'live_backend', label: 'Live backend', ok: liveBackend, weight: 1.5 },
    { id: 'i18n', label: 'Localization', ok: localeConfigured, weight: 0.5 },
    { id: 'offline_ready', label: 'Offline-ready PWA', ok: health.checks.find((c) => c.id === 'offline_sync')?.ok ?? false, weight: 0.5 },
    { id: 'typed_data', label: 'Type-safe Supabase queries', ok: liveBackend && TYPED_SUPABASE_QUERIES, weight: 1 },
    { id: 'portal_rpc', label: 'Portal server RPCs', ok: liveBackend && PORTAL_RPC_ENFORCED, weight: 0.5 },
    { id: 'stripe_webhook_audit', label: 'Stripe webhook audit', ok: liveBackend && STRIPE_WEBHOOK_AUDIT, weight: 0.5 },
    { id: 'audit_i18n', label: 'Localized audit actions', ok: liveBackend && AUDIT_I18N_COVERAGE, weight: 0.5 },
    { id: 'inventory_audit', label: 'Inventory audit logging', ok: liveBackend && INVENTORY_AUDIT, weight: 0.5 },
    { id: 'onboarding_audit', label: 'Onboarding audit logging', ok: liveBackend && ONBOARDING_AUDIT, weight: 0.5 },
    { id: 'fleet_audit', label: 'Fleet audit logging', ok: liveBackend && FLEET_AUDIT, weight: 0.5 },
    { id: 'expense_audit', label: 'Expense audit logging', ok: liveBackend && EXPENSE_AUDIT, weight: 0.5 },
    { id: 'fuel_log_audit', label: 'Fuel log audit logging', ok: liveBackend && FUEL_LOG_AUDIT, weight: 0.5 },
    { id: 'dispatch_audit', label: 'Dispatch audit logging', ok: liveBackend && DISPATCH_AUDIT, weight: 0.5 },
    { id: 'vendor_po_audit', label: 'Vendor PO audit logging', ok: liveBackend && VENDOR_PO_AUDIT, weight: 0.5 },
    { id: 'company_profile_audit', label: 'Company profile audit logging', ok: liveBackend && COMPANY_PROFILE_AUDIT, weight: 0.5 },
    { id: 'portal_audit', label: 'Portal audit logging', ok: liveBackend && PORTAL_AUDIT, weight: 0.5 },
    { id: 'company_switch_audit', label: 'Company switch audit logging', ok: liveBackend && COMPANY_SWITCH_AUDIT, weight: 0.5 },
    { id: 'invite_audit', label: 'Invite accept audit logging', ok: liveBackend && INVITE_AUDIT, weight: 0.5 },
    { id: 'bulk_ops_audit', label: 'Bulk jobs audit logging', ok: liveBackend && BULK_OPS_AUDIT, weight: 0.5 },
    { id: 'billing_plan_audit', label: 'Billing plan audit logging', ok: liveBackend && BILLING_PLAN_AUDIT, weight: 0.5 },
    { id: 'team_invite_audit', label: 'Team invite audit logging', ok: liveBackend && TEAM_INVITE_AUDIT, weight: 0.5 },
    { id: 'invoice_audit', label: 'Invoice audit logging', ok: liveBackend && INVOICE_AUDIT, weight: 0.5 },
    { id: 'sample_import_audit', label: 'Sample import audit logging', ok: liveBackend && SAMPLE_IMPORT_AUDIT, weight: 0.5 },
    { id: 'portal_requests_audit', label: 'Portal requests audit logging', ok: liveBackend && PORTAL_REQUESTS_AUDIT, weight: 0.5 },
    { id: 'estimate_create_audit', label: 'Estimate create audit logging', ok: liveBackend && ESTIMATE_CREATE_AUDIT, weight: 0.5 },
    { id: 'entity_update_audit', label: 'Entity update audit logging', ok: liveBackend && ENTITY_UPDATE_AUDIT, weight: 0.5 },
    { id: 'audit_e2e_full', label: 'Full audit E2E coverage', ok: liveBackend && AUDIT_E2E_FULL_COVERAGE, weight: 0.5 },
    { id: 'integration_probes', label: 'Live integration probes', ok: liveBackend && INTEGRATION_PROBES_AUDIT && probesOk, weight: 0.5 },
    { id: 'integration_probe_ui_audit', label: 'Integration probe UI', ok: liveBackend && INTEGRATION_PROBE_UI_AUDIT && probeUiReady, weight: 0.5 },
    { id: 'integration_probe_history_audit', label: 'Integration probe history', ok: liveBackend && INTEGRATION_PROBE_HISTORY_AUDIT && probeHistoryReady, weight: 0.5 },
    { id: 'notification_hub_audit', label: 'Notification hub', ok: liveBackend && NOTIFICATION_HUB_AUDIT, weight: 0.5 },
    { id: 'portal_notification_prefs_audit', label: 'Portal notification prefs', ok: liveBackend && PORTAL_NOTIFICATION_PREFS_AUDIT, weight: 0.5 },
    { id: 'notification_opt_out_audit', label: 'Notification opt-out', ok: liveBackend && NOTIFICATION_OPT_OUT_AUDIT, weight: 0.5 },
    { id: 'staff_customer_notify_audit', label: 'Staff customer notify prefs', ok: liveBackend && STAFF_CUSTOMER_NOTIFY_AUDIT, weight: 0.5 },
    { id: 'notify_skipped_toast_audit', label: 'Skipped notification toasts', ok: liveBackend && NOTIFY_SKIPPED_TOAST_AUDIT, weight: 0.5 },
    { id: 'portal_staff_notify_sync_audit', label: 'Portal → staff notify sync', ok: liveBackend && PORTAL_STAFF_NOTIFY_SYNC_AUDIT, weight: 0.5 },
    { id: 'notification_hub_skip_log_audit', label: 'Notification hub skip log', ok: liveBackend && NOTIFICATION_HUB_SKIP_LOG_AUDIT, weight: 0.5 },
    { id: 'notification_hub_skip_ops_audit', label: 'Skip log export & clear', ok: liveBackend && NOTIFICATION_HUB_SKIP_OPS_AUDIT, weight: 0.5 },
    { id: 'customer_sms_opt_out_audit', label: 'Customer SMS opt-out', ok: liveBackend && CUSTOMER_SMS_OPT_OUT_AUDIT, weight: 0.5 },
    { id: 'scheduling_customer_sms_audit', label: 'Scheduling customer SMS E2E', ok: liveBackend && SCHEDULING_CUSTOMER_SMS_AUDIT, weight: 0.5 },
    { id: 'observability_probe_audit', label: 'Observability live probe', ok: liveBackend && OBSERVABILITY_PROBE_AUDIT && observabilityProbeOk, weight: 0.5 },
    { id: 'pwa_sw_offline_audit', label: 'Service worker offline gate', ok: liveBackend && PWA_SW_OFFLINE_AUDIT && (health.checks.find((c) => c.id === 'offline_sync')?.ok ?? false), weight: 0.5 },
    { id: 'multi_tenant', label: 'Multi-company membership', ok: liveBackend && MULTI_TENANT_SUPPORTED && Boolean(MULTI_TENANT_MEMBERSHIP_RPC), weight: 0.5 },
  ]

  const qualityWeight = qualityChecks.reduce((sum, check) => sum + check.weight, 0)
  const qualityEarned = qualityChecks.reduce((sum, check) => sum + (check.ok ? check.weight : 0), 0)
  const qualityScore = qualityWeight > 0
    ? Math.round((qualityEarned / qualityWeight) * 100) / 10
    : 0

  const integrationScore = health.score
  const combined = Math.round(((integrationScore * 0.7) + (qualityScore * 0.3)) * 10) / 10
  const score = Math.min(10, combined)

  const grade =
    score >= 9 ? 'A' :
    score >= 8.5 ? 'A-' :
    score >= 8 ? 'B+' :
    score >= 7 ? 'B' :
    score >= 6 ? 'C+' :
    'C'

  const recommendationIds: AuditRecommendationId[] = []
  if (!liveBackend) recommendationIds.push('connect_supabase')
  if (!health.checks.find((check) => check.id === 'stripe')?.ok) {
    recommendationIds.push('configure_stripe')
  }
  if (!health.checks.find((check) => check.id === 'email')?.ok) {
    recommendationIds.push('enable_email')
  }
  if (!health.checks.find((check) => check.id === 'sms')?.ok) {
    recommendationIds.push('enable_sms')
  }
  if (!health.checks.find((check) => check.id === 'openai')?.ok) {
    recommendationIds.push('configure_openai')
  }
  if (!health.checks.find((check) => check.id === 'maps')?.ok) {
    recommendationIds.push('configure_maps')
  }
  if (!health.checks.find((check) => check.id === 'offline_sync')?.ok) {
    recommendationIds.push('offline_sync')
  }
  if (!health.checks.find((check) => check.id === 'observability')?.ok) {
    recommendationIds.push('observability')
  }
  if (recommendationIds.length === 0) {
    recommendationIds.push('all_ready')
  }

  const readyForProduction = score >= 8.5 && hasSupabaseFromHealth(health.checks) && liveBackend

  return {
    score,
    grade,
    integrationScore,
    qualityScore,
    checks: [...health.checks.map((check) => ({ ...check, weight: check.weight * 0.7 })), ...qualityChecks],
    recommendationIds,
    summaryKey: readyForProduction ? 'ready' : 'needs_config',
    readyForProduction,
  }
}

function hasSupabaseFromHealth(checks: { id: string; ok: boolean }[]): boolean {
  return checks.find((check) => check.id === 'supabase')?.ok ?? false
}
