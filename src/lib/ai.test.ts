import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/env', () => ({
  hasOpenAI: false,
  env: {},
  getOpenAIEndpoint: () => null,
  isE2eMockBackend: true,
}))

vi.mock('@/lib/supabase', () => ({
  getSupabaseAuthHeaders: vi.fn(async () => ({})),
}))

import {
  analyzeWorkOrderPDF,
  analyzeEmailWorkOrder,
  askBusinessAssistant,
  generateSmartEstimate,
} from '@/lib/ai'

describe('ai', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('analyzeWorkOrderPDF extracts drywall repair fallback', async () => {
    const promise = analyzeWorkOrderPDF('Repair drywall damage in unit 204 at 123 Main Street. Emergency ASAP.')
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.job?.requested_repairs?.length).toBeGreaterThan(0)
    expect(result.job?.priority).toBe('high')
    expect(result.estimate?.suggested_price_min).toBeGreaterThan(0)
    expect(result.tasks?.length).toBeGreaterThan(0)
  })

  it('analyzeEmailWorkOrder delegates to PDF analyzer', async () => {
    const promise = analyzeEmailWorkOrder('Leaking faucet at 555-123-4567. tenant@example.com')
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.customer?.phone).toBe('555-123-4567')
    expect(result.customer?.email).toBe('tenant@example.com')
  })

  it('askBusinessAssistant returns Russian lost-money fallback', async () => {
    const promise = askBusinessAssistant('Какие заказы принесли убыток?', 'ru')
    await vi.runAllTimersAsync()
    const answer = await promise

    expect(answer).toMatch(/JOB-0087|убыток/i)
  })

  it('askBusinessAssistant returns English lost-money fallback', async () => {
    const promise = askBusinessAssistant('Which jobs lost money this month?', 'en')
    await vi.runAllTimersAsync()
    const answer = await promise

    expect(answer).toMatch(/Job #JOB-0087|loss/i)
  })

  it('generateSmartEstimate uses historical job averages', () => {
    const estimate = generateSmartEstimate('Drywall', [
      { estimated_hours: 4, actual_hours: 5, revenue: 500, profit_margin: 40 },
      { estimated_hours: 3, actual_hours: 4, revenue: 450, profit_margin: 35 },
    ])

    expect(estimate.hours).toBeGreaterThan(0)
    expect(estimate.price).toBeGreaterThan(0)
    expect(estimate.confidence).toBeGreaterThan(0.5)
  })

  it('generateSmartEstimate defaults when no history', () => {
    expect(generateSmartEstimate('Unknown', [])).toEqual({ hours: 4, price: 450, confidence: 0.5 })
  })
})
