import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PLAN_PRICES, STRIPE_WEBHOOK_AUDIT, updateCompanySubscription } from './billing-service'

vi.mock('@/lib/supabase', () => ({
  supabase: {},
}))

vi.mock('@/lib/supabase-queries', () => ({
  updateRows: vi.fn(async () => undefined),
}))

describe('billing-service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('exports stripe webhook audit gate', () => {
    expect(STRIPE_WEBHOOK_AUDIT).toBe(true)
  })

  it('defines plan prices for all tiers', () => {
    expect(PLAN_PRICES.starter).toBe(49)
    expect(PLAN_PRICES.professional).toBe(99)
    expect(PLAN_PRICES.enterprise).toBe(199)
  })

  it('updateCompanySubscription persists plan in localStorage', async () => {
    const updated = await updateCompanySubscription('comp-test', 'enterprise')
    expect(updated.subscription_plan).toBe('enterprise')
    const stored = JSON.parse(localStorage.getItem('handymanos_company') ?? '{}') as { subscription_plan?: string }
    expect(stored.subscription_plan).toBe('enterprise')
  })
})
