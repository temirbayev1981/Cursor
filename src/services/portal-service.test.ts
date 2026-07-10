import { describe, it, expect, beforeEach } from 'vitest'
import {
  createPortalLink,
  validatePortalToken,
  getPortalSession,
  setPortalSession,
  clearPortalSession,
} from './portal-service'

describe('portal-service', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('creates and validates a portal token locally', async () => {
    const { token } = await createPortalLink('comp-001', 'cust-001', 'customer', 'client@test.com')
    const session = await validatePortalToken(token)
    expect(session?.customerId).toBe('cust-001')
    expect(session?.portalType).toBe('customer')
    expect(session?.token).toBe(token)
  })

  it('stores and clears portal session', () => {
    setPortalSession({
      customerId: 'cust-001',
      companyId: 'comp-001',
      portalType: 'customer',
      expiresAt: Date.now() + 3600000,
      token: 'test-token',
    })
    expect(getPortalSession()?.customerId).toBe('cust-001')
    clearPortalSession()
    expect(getPortalSession()).toBeNull()
  })

  it('returns null for expired session', () => {
    setPortalSession({
      customerId: 'cust-001',
      companyId: 'comp-001',
      portalType: 'customer',
      expiresAt: Date.now() - 1000,
      token: 'expired-token',
    })
    expect(getPortalSession()).toBeNull()
  })
})
