import { describe, it, expect } from 'vitest'
import { formatAuditAction, isAuditActionKey, countUniqueAuditActions, AUDIT_ACTION_COUNT, AUDIT_E2E_FULL_COVERAGE, BILLING_PLAN_AUDIT, BULK_OPS_AUDIT, COMPANY_PROFILE_AUDIT, COMPANY_SWITCH_AUDIT, CUSTOMER_SMS_OPT_OUT_AUDIT, DISPATCH_AUDIT, DISPATCH_ETA_SMS_AUDIT, ENTITY_UPDATE_AUDIT, ESTIMATE_CREATE_AUDIT, ESTIMATE_INVOICE_SMS_AUDIT, EXPENSE_AUDIT, FLEET_AUDIT, FUEL_LOG_AUDIT, INTEGRATION_PROBES_AUDIT, INTEGRATION_PROBE_HISTORY_AUDIT, INTEGRATION_PROBE_UI_AUDIT, INVOICE_AUDIT, INVITE_AUDIT, NOTIFICATION_HUB_AUDIT, NOTIFICATION_HUB_DISPATCH_EMAIL_SKIP_AUDIT, NOTIFICATION_HUB_ETA_EMAIL_SKIP_AUDIT, NOTIFICATION_HUB_ETA_SMS_SKIP_AUDIT, NOTIFICATION_HUB_ESTIMATE_INVOICE_SMS_SKIP_AUDIT, NOTIFICATION_HUB_INVOICE_EMAIL_SKIP_AUDIT, NOTIFICATION_HUB_SCHEDULING_EMAIL_SKIP_AUDIT, NOTIFICATION_HUB_SCHEDULING_SMS_SKIP_AUDIT, NOTIFICATION_HUB_SKIP_CHANNEL_FILTER_AUDIT, NOTIFICATION_HUB_SKIP_LOG_AUDIT, NOTIFICATION_HUB_SKIP_OPS_AUDIT, NOTIFICATION_HUB_SKIP_SUMMARY_AUDIT, NOTIFICATION_HUB_SMS_SKIP_CSV_AUDIT, NOTIFICATION_MILESTONE_AUDIT, NOTIFICATION_OPT_OUT_AUDIT, NOTIFY_SKIPPED_TOAST_AUDIT, OBSERVABILITY_PROBE_AUDIT, PORTAL_AUDIT, PORTAL_EMAIL_OPT_OUT_BADGE_AUDIT, PORTAL_NOTIFICATION_PREFS_AUDIT, PORTAL_REQUESTS_AUDIT, PORTAL_SMS_NOTIFY_SYNC_AUDIT, PORTAL_SMS_OPT_OUT_BADGE_AUDIT, PORTAL_STAFF_NOTIFY_SYNC_AUDIT, PWA_SW_OFFLINE_AUDIT, SAMPLE_IMPORT_AUDIT, SCHEDULING_CUSTOMER_SMS_AUDIT, STAFF_CUSTOMER_NOTIFY_AUDIT, STAFF_CUSTOMER_SMS_BADGE_AUDIT, TEAM_INVITE_AUDIT, VENDOR_PO_AUDIT } from './audit-labels'

describe('audit-labels', () => {
  const labels = {
    'team.invite_sent': 'Team invite sent',
    'jobs.bulk_cancel': 'Bulk cancelled jobs',
  } as const

  it('formats known audit actions', () => {
    expect(isAuditActionKey('team.invite_sent')).toBe(true)
    expect(formatAuditAction('team.invite_sent', labels as never)).toBe('Team invite sent')
  })

  it('falls back to raw action for unknown keys', () => {
    expect(isAuditActionKey('custom.unknown')).toBe(false)
    expect(formatAuditAction('custom.unknown', labels as never)).toBe('custom.unknown')
  })

  it('recognizes Phase 79 audit action keys', () => {
    expect(isAuditActionKey('customer.create')).toBe(true)
    expect(isAuditActionKey('invoice.create')).toBe(true)
    expect(isAuditActionKey('job.status_change')).toBe(true)
  })

  it('recognizes Phase 81 field-ops audit keys', () => {
    expect(isAuditActionKey('job.create')).toBe(true)
    expect(isAuditActionKey('schedule.create')).toBe(true)
    expect(isAuditActionKey('estimate.sent')).toBe(true)
  })

  it('recognizes v1.8 inventory audit keys', () => {
    expect(isAuditActionKey('inventory.receive')).toBe(true)
    expect(isAuditActionKey('inventory.apply')).toBe(true)
  })

  it('recognizes v1.8.1 catalog and onboarding audit keys', () => {
    expect(isAuditActionKey('material.create')).toBe(true)
    expect(isAuditActionKey('property.create')).toBe(true)
    expect(isAuditActionKey('onboarding.complete')).toBe(true)
  })

  it('recognizes v1.8.2 fleet audit keys', () => {
    expect(isAuditActionKey('employee.create')).toBe(true)
    expect(isAuditActionKey('vehicle.create')).toBe(true)
    expect(FLEET_AUDIT).toBe(true)
  })

  it('recognizes v1.8.3 expense audit keys', () => {
    expect(isAuditActionKey('expense.create')).toBe(true)
    expect(isAuditActionKey('expense.update')).toBe(true)
    expect(EXPENSE_AUDIT).toBe(true)
  })

  it('recognizes v1.8.4 fuel log and dispatch audit keys', () => {
    expect(isAuditActionKey('fuel_log.create')).toBe(true)
    expect(isAuditActionKey('dispatch.status_change')).toBe(true)
    expect(FUEL_LOG_AUDIT).toBe(true)
    expect(DISPATCH_AUDIT).toBe(true)
  })

  it('recognizes v1.8.5 vendor PO and company profile audit gates', () => {
    expect(isAuditActionKey('vendor_po_to_job')).toBe(true)
    expect(isAuditActionKey('emergency_alert')).toBe(true)
    expect(isAuditActionKey('company.profile_update')).toBe(true)
    expect(VENDOR_PO_AUDIT).toBe(true)
    expect(COMPANY_PROFILE_AUDIT).toBe(true)
  })

  it('recognizes v1.8.6 portal and tenant audit gates', () => {
    expect(isAuditActionKey('portal.estimate_approve')).toBe(true)
    expect(isAuditActionKey('portal.invoice_payment')).toBe(true)
    expect(isAuditActionKey('company.switch')).toBe(true)
    expect(isAuditActionKey('invite.accept')).toBe(true)
    expect(PORTAL_AUDIT).toBe(true)
    expect(COMPANY_SWITCH_AUDIT).toBe(true)
    expect(INVITE_AUDIT).toBe(true)
  })

  it('recognizes v1.8.7 bulk and billing audit gates', () => {
    expect(isAuditActionKey('jobs.bulk_cancel')).toBe(true)
    expect(isAuditActionKey('jobs.bulk_assign')).toBe(true)
    expect(isAuditActionKey('billing.plan_upgrade')).toBe(true)
    expect(isAuditActionKey('team.invite_sent')).toBe(true)
    expect(BULK_OPS_AUDIT).toBe(true)
    expect(BILLING_PLAN_AUDIT).toBe(true)
    expect(TEAM_INVITE_AUDIT).toBe(true)
  })

  it('recognizes v1.8.8 invoice and portal request audit gates', () => {
    expect(isAuditActionKey('invoice.payment')).toBe(true)
    expect(isAuditActionKey('invoice.sent')).toBe(true)
    expect(isAuditActionKey('sample.import')).toBe(true)
    expect(isAuditActionKey('portal.review_submit')).toBe(true)
    expect(isAuditActionKey('portal.job_submit')).toBe(true)
    expect(INVOICE_AUDIT).toBe(true)
    expect(SAMPLE_IMPORT_AUDIT).toBe(true)
    expect(PORTAL_REQUESTS_AUDIT).toBe(true)
  })

  it('recognizes v1.8.9 full audit E2E coverage gates', () => {
    expect(isAuditActionKey('jobs.bulk_delete')).toBe(true)
    expect(isAuditActionKey('jobs.bulk_schedule')).toBe(true)
    expect(isAuditActionKey('estimate.create')).toBe(true)
    expect(isAuditActionKey('portal.estimate_decline')).toBe(true)
    expect(isAuditActionKey('customer.update')).toBe(true)
    expect(isAuditActionKey('job.update')).toBe(true)
    expect(ESTIMATE_CREATE_AUDIT).toBe(true)
    expect(ENTITY_UPDATE_AUDIT).toBe(true)
    expect(AUDIT_E2E_FULL_COVERAGE).toBe(true)
    expect(INTEGRATION_PROBES_AUDIT).toBe(true)
  })

  it('recognizes v1.9.0 integration probes gate', () => {
    expect(INTEGRATION_PROBES_AUDIT).toBe(true)
  })

  it('recognizes v1.9.1 observability probe gate', () => {
    expect(OBSERVABILITY_PROBE_AUDIT).toBe(true)
  })

  it('recognizes v1.9.2 PWA service worker offline gate', () => {
    expect(PWA_SW_OFFLINE_AUDIT).toBe(true)
  })

  it('recognizes v1.9.3 integration probe UI gate', () => {
    expect(INTEGRATION_PROBE_UI_AUDIT).toBe(true)
  })

  it('recognizes v1.9.4 integration probe history gate', () => {
    expect(INTEGRATION_PROBE_HISTORY_AUDIT).toBe(true)
  })

  it('recognizes v1.10 notification hub gate', () => {
    expect(NOTIFICATION_HUB_AUDIT).toBe(true)
  })

  it('recognizes v1.10.1 portal notification prefs gate', () => {
    expect(PORTAL_NOTIFICATION_PREFS_AUDIT).toBe(true)
  })

  it('recognizes v1.10.2 notification opt-out gate', () => {
    expect(NOTIFICATION_OPT_OUT_AUDIT).toBe(true)
  })

  it('recognizes v1.10.3 staff customer notify gate', () => {
    expect(STAFF_CUSTOMER_NOTIFY_AUDIT).toBe(true)
  })

  it('recognizes v1.10.4 notify skipped toast gate', () => {
    expect(NOTIFY_SKIPPED_TOAST_AUDIT).toBe(true)
  })

  it('recognizes v1.10.5 portal staff notify sync gate', () => {
    expect(PORTAL_STAFF_NOTIFY_SYNC_AUDIT).toBe(true)
  })

  it('recognizes v1.10.6 notification hub skip log gate', () => {
    expect(NOTIFICATION_HUB_SKIP_LOG_AUDIT).toBe(true)
  })

  it('recognizes v1.10.7 notification hub skip ops gate', () => {
    expect(NOTIFICATION_HUB_SKIP_OPS_AUDIT).toBe(true)
  })

  it('recognizes v1.10.8 customer SMS opt-out gate', () => {
    expect(CUSTOMER_SMS_OPT_OUT_AUDIT).toBe(true)
    expect(SCHEDULING_CUSTOMER_SMS_AUDIT).toBe(true)
    expect(ESTIMATE_INVOICE_SMS_AUDIT).toBe(true)
    expect(DISPATCH_ETA_SMS_AUDIT).toBe(true)
    expect(PORTAL_SMS_NOTIFY_SYNC_AUDIT).toBe(true)
    expect(NOTIFICATION_HUB_ESTIMATE_INVOICE_SMS_SKIP_AUDIT).toBe(true)
    expect(STAFF_CUSTOMER_SMS_BADGE_AUDIT).toBe(true)
    expect(NOTIFICATION_HUB_ETA_SMS_SKIP_AUDIT).toBe(true)
    expect(PORTAL_SMS_OPT_OUT_BADGE_AUDIT).toBe(true)
    expect(NOTIFICATION_HUB_SCHEDULING_SMS_SKIP_AUDIT).toBe(true)
    expect(PORTAL_EMAIL_OPT_OUT_BADGE_AUDIT).toBe(true)
    expect(NOTIFICATION_HUB_SMS_SKIP_CSV_AUDIT).toBe(true)
    expect(NOTIFICATION_HUB_SKIP_SUMMARY_AUDIT).toBe(true)
    expect(NOTIFICATION_HUB_DISPATCH_EMAIL_SKIP_AUDIT).toBe(true)
    expect(NOTIFICATION_HUB_SCHEDULING_EMAIL_SKIP_AUDIT).toBe(true)
    expect(NOTIFICATION_HUB_ETA_EMAIL_SKIP_AUDIT).toBe(true)
    expect(NOTIFICATION_HUB_INVOICE_EMAIL_SKIP_AUDIT).toBe(true)
    expect(NOTIFICATION_MILESTONE_AUDIT).toBe(true)
    expect(NOTIFICATION_HUB_SKIP_CHANNEL_FILTER_AUDIT).toBe(true)
  })

  it('tracks audit action count', () => {
    expect(AUDIT_ACTION_COUNT).toBe(44)
  })

  it('counts unique audit actions in log', () => {
    const count = countUniqueAuditActions([
      { action: 'team.invite_sent' },
      { action: 'team.invite_sent' },
      { action: 'invoice.payment' },
    ])
    expect(count).toBe(2)
  })
})
