/**
 * Canonical audit action keys — single source of truth for i18n, E2E, and quality gates.
 * Add a key here only with matching EN/RU labels and audit-expanded E2E coverage.
 */
export const AUDIT_ACTION_REGISTRY = [
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
  'expense.create',
  'expense.update',
  'fuel_log.create',
  'fuel_log.update',
] as const

export type AuditActionRegistryKey = (typeof AUDIT_ACTION_REGISTRY)[number]

export const AUDIT_ACTION_REGISTRY_COUNT = AUDIT_ACTION_REGISTRY.length
