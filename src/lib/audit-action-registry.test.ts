import { describe, it, expect } from 'vitest'
import { AUDIT_ACTION_REGISTRY, AUDIT_ACTION_REGISTRY_COUNT } from '@/lib/audit-action-registry'
import { AUDIT_ACTION_COUNT } from '@/lib/audit-labels'

describe('audit-action-registry', () => {
  it('exports a stable registry count', () => {
    expect(AUDIT_ACTION_REGISTRY_COUNT).toBe(AUDIT_ACTION_REGISTRY.length)
    expect(AUDIT_ACTION_REGISTRY_COUNT).toBeGreaterThanOrEqual(40)
  })

  it('stays in sync with audit-labels AUDIT_ACTION_COUNT', () => {
    expect(AUDIT_ACTION_COUNT).toBe(AUDIT_ACTION_REGISTRY_COUNT)
  })

  it('has no duplicate keys', () => {
    expect(new Set(AUDIT_ACTION_REGISTRY).size).toBe(AUDIT_ACTION_REGISTRY.length)
  })
})
