import { describe, it, expect, beforeEach } from 'vitest'
import { computePlatformAudit } from './platform-audit'

describe('platform-audit', () => {
  beforeEach(() => {
    localStorage.setItem('handymanos_locale', 'en')
  })

  it('returns combined audit score and recommendation ids', () => {
    const report = computePlatformAudit()
    expect(report.score).toBeGreaterThanOrEqual(0)
    expect(report.score).toBeLessThanOrEqual(10)
    expect(report.integrationScore).toBeGreaterThanOrEqual(0)
    expect(report.qualityScore).toBeGreaterThanOrEqual(0)
    expect(report.recommendationIds.length).toBeGreaterThan(0)
    expect(report.summaryKey).toMatch(/^(ready|needs_config)$/)
    expect(report.grade).toMatch(/^[A-C][+-]?$/)
  })

  it('includes observability recommendation when unset', () => {
    const report = computePlatformAudit()
    const hasObservabilityRec = report.recommendationIds.includes('observability')
    const allReady = report.recommendationIds.includes('all_ready')
    expect(hasObservabilityRec || allReady).toBe(true)
  })

  it('requires connect_supabase when live Supabase env is missing', () => {
    const report = computePlatformAudit()
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      expect(report.recommendationIds).toContain('connect_supabase')
      expect(report.summaryKey).toBe('needs_config')
      expect(report.readyForProduction).toBe(false)
    }
  })
})
