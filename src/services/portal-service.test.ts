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

  it('returns null for unknown portal token (RPC-only)', async () => {
    const session = await validatePortalToken('totally-unknown-token-phase70')
    expect(session).toBeNull()
  })

  it('does not accept local-only portal token when RPC rejects it', async () => {
    localStorage.setItem('handymanos_portal_tokens', JSON.stringify([{
      id: 'pt-local-only',
      company_id: 'comp-001',
      customer_id: 'cust-001',
      portal_type: 'customer',
      token: 'local-only-token-phase70',
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
    }]))
    const session = await validatePortalToken('local-only-token-phase70')
    expect(session).toBeNull()
  })
})
