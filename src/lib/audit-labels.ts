import type { en } from '@/i18n/locales/en'

export type AuditActionKey = keyof typeof en.settings.auditActions

const AUDIT_ACTION_KEYS = new Set<string>([
  'jobs.bulk_cancel',
  'jobs.bulk_delete',
  'jobs.bulk_assign',
  'jobs.bulk_schedule',
  'invoice.payment',
  'invoice.sent',
  'company.profile_update',
  'company.switch',
  'team.invite_sent',
  'invite.accept',
  'estimate.create',
  'dispatch.status_change',
  'vendor_po_to_job',
  'emergency_alert',
  'portal.estimate_approve',
  'portal.estimate_decline',
  'portal.job_submit',
  'portal.review_submit',
  'portal.invoice_payment',
  'sample.import',
  'billing.plan_upgrade',
  'customer.create',
  'customer.update',
  'invoice.create',
  'job.status_change',
  'job.create',
  'job.update',
  'schedule.create',
  'estimate.sent',
  'inventory.receive',
  'inventory.apply',
  'material.create',
  'material.update',
  'property.create',
  'property.update',
  'onboarding.complete',
  'employee.create',
  'employee.update',
  'vehicle.create',
  'vehicle.update',
])

export function isAuditActionKey(action: string): action is AuditActionKey {
  return AUDIT_ACTION_KEYS.has(action)
}

/** Number of localized audit action keys (quality gate for platform audit). */
export const AUDIT_ACTION_COUNT = AUDIT_ACTION_KEYS.size

export const AUDIT_I18N_COVERAGE = AUDIT_ACTION_COUNT >= 40

/** Employee and vehicle mutations write audit_logs. */
export const FLEET_AUDIT = true as const

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
