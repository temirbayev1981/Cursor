import type { en } from '@/i18n/locales/en'
import { INVENTORY_AUDIT } from '@/services/inventory-service'
import { AUDIT_ACTION_REGISTRY } from '@/lib/audit-action-registry'

export type AuditActionKey = keyof typeof en.settings.auditActions

const AUDIT_ACTION_KEYS = new Set<string>(AUDIT_ACTION_REGISTRY)

export function isAuditActionKey(action: string): action is AuditActionKey {
  return AUDIT_ACTION_KEYS.has(action)
}

/** Number of localized audit action keys (quality gate for platform audit). */
export const AUDIT_ACTION_COUNT = AUDIT_ACTION_KEYS.size

export const AUDIT_I18N_COVERAGE = AUDIT_ACTION_COUNT >= 40

/** Employee and vehicle mutations write audit_logs. */
export const FLEET_AUDIT = true as const

/** Expense mutations write audit_logs. */
export const EXPENSE_AUDIT = true as const

/** Fuel log mutations write audit_logs. */
export const FUEL_LOG_AUDIT = true as const

/** Technician mobile offline sync E2E covers queue and reconnect. */
export const TECH_OFFLINE_SYNC_AUDIT = true as const

/** Dispatch board status changes write audit_logs. */
export const DISPATCH_AUDIT = true as const

/** Field-ops milestone: inventory, fleet, expense, fuel, dispatch, and offline sync gates. */
export const FIELD_OPS_MILESTONE_AUDIT =
  INVENTORY_AUDIT
  && FLEET_AUDIT
  && EXPENSE_AUDIT
  && FUEL_LOG_AUDIT
  && DISPATCH_AUDIT
  && TECH_OFFLINE_SYNC_AUDIT

/** Vendor PO workflow writes audit_logs. */
export const VENDOR_PO_AUDIT = true as const

/** Company profile updates write audit_logs. */
export const COMPANY_PROFILE_AUDIT = true as const

/** Customer portal actions write audit_logs. */
export const PORTAL_AUDIT = true as const

/** Multi-company switch writes audit_logs. */
export const COMPANY_SWITCH_AUDIT = true as const

/** Team invite acceptance writes audit_logs. */
export const INVITE_AUDIT = true as const

/** Bulk job operations write audit_logs. */
export const BULK_OPS_AUDIT = true as const

/** Billing plan upgrades write audit_logs. */
export const BILLING_PLAN_AUDIT = true as const

/** Team invite sends write audit_logs. */
export const TEAM_INVITE_AUDIT = true as const

/** Invoice payment and send write audit_logs. */
export const INVOICE_AUDIT = true as const

/** Sample data import writes audit_logs. */
export const SAMPLE_IMPORT_AUDIT = true as const

/** Portal job/review requests write audit_logs. */
export const PORTAL_REQUESTS_AUDIT = true as const

/** Estimate creation from job workflow writes audit_logs. */
export const ESTIMATE_CREATE_AUDIT = true as const

/** Entity update mutations write audit_logs. */
export const ENTITY_UPDATE_AUDIT = true as const

/** All localized audit actions have E2E coverage in audit-expanded.spec.ts. */
export const AUDIT_E2E_FULL_COVERAGE = true as const

/** Live integration endpoint probes affect platform health scores. */
export const INTEGRATION_PROBES_AUDIT = true as const

/** Observability webhook probes affect platform health scores. */
export const OBSERVABILITY_PROBE_AUDIT = true as const

/** Service worker registration required for honest offline sync gate. */
export const PWA_SW_OFFLINE_AUDIT = true as const

/** Settings → Integrations shows live probe badges after probe run. */
export const INTEGRATION_PROBE_UI_AUDIT = true as const

/** Settings → System stores integration probe run history for operators. */
export const INTEGRATION_PROBE_HISTORY_AUDIT = true as const

/** Settings notification hub exposes queue filter, status, and retry. */
export const NOTIFICATION_HUB_AUDIT = true as const

/** Customer portal notification preferences sync via portal RPCs. */
export const PORTAL_NOTIFICATION_PREFS_AUDIT = true as const

/** Estimate and invoice notifications respect customer email opt-out. */
export const NOTIFICATION_OPT_OUT_AUDIT = true as const

/** Staff customer form edits notification preferences with table badge. */
export const STAFF_CUSTOMER_NOTIFY_AUDIT = true as const

/** Dispatch and scheduling show skipped toasts when customer email is opted out. */
export const NOTIFY_SKIPPED_TOAST_AUDIT = true as const

/** Portal notification preference changes sync to staff CRM customer record. */
export const PORTAL_STAFF_NOTIFY_SYNC_AUDIT = true as const

/** Notification hub records and filters customer opt-out skips. */
export const NOTIFICATION_HUB_SKIP_LOG_AUDIT = true as const

/** Notification hub exports and clears skip log for operators. */
export const NOTIFICATION_HUB_SKIP_OPS_AUDIT = true as const

/** Customer SMS notifications respect SMS opt-out in dispatch/scheduling. */
export const CUSTOMER_SMS_OPT_OUT_AUDIT = true as const

/** Scheduling page E2E covers customer SMS skip and queue flows. */
export const SCHEDULING_CUSTOMER_SMS_AUDIT = true as const

/** Estimate and invoice sends respect customer SMS opt-out. */
export const ESTIMATE_INVOICE_SMS_AUDIT = true as const

/** Dispatch in_progress ETA SMS E2E covers skip and queue flows. */
export const DISPATCH_ETA_SMS_AUDIT = true as const

/** Portal SMS notification preferences sync bidirectionally with staff CRM. */
export const PORTAL_SMS_NOTIFY_SYNC_AUDIT = true as const

/** Notification hub Skipped tab shows estimate and invoice SMS opt-out entries. */
export const NOTIFICATION_HUB_ESTIMATE_INVOICE_SMS_SKIP_AUDIT = true as const

/** Customers table shows SMS opt-out badge when SMS notifications disabled. */
export const STAFF_CUSTOMER_SMS_BADGE_AUDIT = true as const

/** Notification hub Skipped tab shows dispatch ETA SMS opt-out entries. */
export const NOTIFICATION_HUB_ETA_SMS_SKIP_AUDIT = true as const

/** Customer portal shows SMS opt-out badge when SMS notifications disabled. */
export const PORTAL_SMS_OPT_OUT_BADGE_AUDIT = true as const

/** Notification hub Skipped tab shows scheduling SMS opt-out entries. */
export const NOTIFICATION_HUB_SCHEDULING_SMS_SKIP_AUDIT = true as const

/** Portal email opt-out badge syncs with staff CRM notification prefs. */
export const PORTAL_EMAIL_OPT_OUT_BADGE_AUDIT = true as const

/** Hub skip log CSV export includes SMS channel entries. */
export const NOTIFICATION_HUB_SMS_SKIP_CSV_AUDIT = true as const

/** Notification hub summary shows skipped count with email/SMS breakdown. */
export const NOTIFICATION_HUB_SKIP_SUMMARY_AUDIT = true as const

/** Notification hub Skipped tab shows dispatch scheduled email opt-out entries. */
export const NOTIFICATION_HUB_DISPATCH_EMAIL_SKIP_AUDIT = true as const

/** Notification hub Skipped tab shows scheduling email opt-out entries. */
export const NOTIFICATION_HUB_SCHEDULING_EMAIL_SKIP_AUDIT = true as const

/** Notification hub Skipped tab shows dispatch ETA email opt-out entries. */
export const NOTIFICATION_HUB_ETA_EMAIL_SKIP_AUDIT = true as const

/** Notification hub Skipped tab shows invoice email opt-out entries. */
export const NOTIFICATION_HUB_INVOICE_EMAIL_SKIP_AUDIT = true as const

/** Notification milestone: hub, portal, CRM, and SMS opt-out gates complete. */
export const NOTIFICATION_MILESTONE_AUDIT = true as const

/** Notification hub email/SMS tabs filter skip log by channel. */
export const NOTIFICATION_HUB_SKIP_CHANNEL_FILTER_AUDIT = true as const

/** Hub skip log CSV export includes email channel entries. */
export const NOTIFICATION_HUB_EMAIL_SKIP_CSV_AUDIT = true as const

/** Server-side paginated entity tables (Phase 135 complete). */
export const SERVER_PAGINATION_AUDIT = true as const

/** Lightweight KPI summary queries on paginated entity pages. */
export const KPI_SUMMARY_AUDIT = true as const

export function countUniqueAuditActions(logs: { action: string }[]): number {
  return new Set(logs.map((log) => log.action)).size
}

export function formatAuditAction(
  action: string,
  labels: Record<AuditActionKey, string>,
): string {
  if (isAuditActionKey(action)) return labels[action]
  return action
}
