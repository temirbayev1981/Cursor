import { describe, it, expect } from 'vitest'
import { formatAuditAction, isAuditActionKey, countUniqueAuditActions, BILLING_PLAN_AUDIT, BULK_OPS_AUDIT, COMPANY_PROFILE_AUDIT, COMPANY_SWITCH_AUDIT, DISPATCH_AUDIT, EXPENSE_AUDIT, FLEET_AUDIT, FUEL_LOG_AUDIT, INVITE_AUDIT, PORTAL_AUDIT, TEAM_INVITE_AUDIT, VENDOR_PO_AUDIT } from './audit-labels'

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

  it('counts unique audit actions in log', () => {
    const count = countUniqueAuditActions([
      { action: 'team.invite_sent' },
      { action: 'team.invite_sent' },
      { action: 'invoice.payment' },
    ])
    expect(count).toBe(2)
  })
})
