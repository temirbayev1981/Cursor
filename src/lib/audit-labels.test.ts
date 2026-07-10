import { describe, it, expect } from 'vitest'
import { formatAuditAction, isAuditActionKey, countUniqueAuditActions, FLEET_AUDIT } from './audit-labels'

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

  it('counts unique audit actions in log', () => {
    const count = countUniqueAuditActions([
      { action: 'team.invite_sent' },
      { action: 'team.invite_sent' },
      { action: 'invoice.payment' },
    ])
    expect(count).toBe(2)
  })
})
