import { describe, it, expect, beforeEach } from 'vitest'
import {
  portalSubmitReview,
  hasPortalReview,
  getPortalReviewKey,
} from './portal-data-service'
import type { PortalContext } from '@/types/portal'

const portal: PortalContext = {
  companyId: 'comp-001',
  customerId: 'cust-001',
  customerName: 'Test Customer',
  isMagicLink: true,
}

describe('portal-data-service reviews', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores demo review in localStorage', async () => {
    const ok = await portalSubmitReview(portal, 5, 'Great service')
    expect(ok).toBe(true)
    expect(hasPortalReview(portal.customerId)).toBe(true)

    const stored = JSON.parse(localStorage.getItem(getPortalReviewKey(portal.customerId)) || '{}') as {
      rating: number
      comment: string
    }
    expect(stored.rating).toBe(5)
    expect(stored.comment).toBe('Great service')
  })

  it('rejects invalid rating', async () => {
    const ok = await portalSubmitReview(portal, 0, '')
    expect(ok).toBe(false)
    expect(hasPortalReview(portal.customerId)).toBe(false)
  })
})
