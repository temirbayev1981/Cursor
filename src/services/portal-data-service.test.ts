import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  portalSubmitReview,
  hasPortalReview,
  fetchPortalEstimates,
} from './portal-data-service'
import type { PortalContext } from '@/types/portal'

vi.mock('@/lib/supabase-rpc', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/supabase-rpc')>()
  return {
    ...actual,
    callRpc: vi.fn(actual.callRpc),
  }
})

import { callRpc } from '@/lib/supabase-rpc'

const portal: PortalContext = {
  companyId: 'comp-001',
  customerId: 'cust-002',
  customerName: 'Test Customer',
  isMagicLink: true,
}

describe('portal-data-service reviews', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.setItem('handymanos_portal_session', JSON.stringify({
      customerId: 'cust-002',
      companyId: 'comp-001',
      portalType: 'customer',
      expiresAt: Date.now() + 86400000,
      token: 'e2e-portal-customer-token',
    }))
  })

  it('stores portal review via RPC', async () => {
    const ok = await portalSubmitReview(portal, 5, 'Great service')
    expect(ok).toBe(true)
    expect(hasPortalReview(portal.customerId)).toBe(true)
  })

  it('rejects invalid rating', async () => {
    const ok = await portalSubmitReview(portal, 0, '')
    expect(ok).toBe(false)
    expect(hasPortalReview(portal.customerId)).toBe(false)
  })

  it('returns empty estimates when RPC fails (no localStorage bypass)', async () => {
    vi.mocked(callRpc).mockResolvedValueOnce({ data: null, error: { message: 'rpc failed' } })
    const rows = await fetchPortalEstimates(portal)
    expect(rows).toEqual([])
  })
})
