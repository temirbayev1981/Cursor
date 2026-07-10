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
])

export function isAuditActionKey(action: string): action is AuditActionKey {
  return AUDIT_ACTION_KEYS.has(action)
}

export function formatAuditAction(
  action: string,
  labels: Record<AuditActionKey, string>,
): string {
  if (isAuditActionKey(action)) return labels[action]
  return action
}
