import { describe, it, expect, vi, beforeEach } from 'vitest'
import { startStripeCheckout } from './stripe-service'

vi.mock('@/lib/env', () => ({
  hasStripe: false,
  env: { VITE_STRIPE_PUBLISHABLE_KEY: undefined },
  getStripeCheckoutEndpoint: () => undefined,
}))

vi.mock('@/lib/supabase', () => ({
  getSupabaseAuthHeaders: vi.fn(async () => ({ Authorization: 'Bearer test' })),
}))

describe('stripe-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when Stripe is not configured', async () => {
    const result = await startStripeCheckout({
      invoiceId: 'inv-001',
      invoiceNumber: 'INV-1001',
      amount: 150,
    })
    expect(result).toBe('error')
  })
})
