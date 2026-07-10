import { describe, it, expect, beforeEach } from 'vitest'
import { computePlatformAudit } from './platform-audit'
import { PORTAL_RPC_ENFORCED } from '@/services/portal-data-service'
import { TYPED_SUPABASE_QUERIES } from '@/lib/supabase-queries'
import { MULTI_TENANT_SUPPORTED } from '@/services/company-service'

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

  it('uses compile-time quality gate constants', () => {
    expect(PORTAL_RPC_ENFORCED).toBe(true)
    expect(TYPED_SUPABASE_QUERIES).toBe(true)
    expect(MULTI_TENANT_SUPPORTED).toBe(true)

    const report = computePlatformAudit()
    const typed = report.checks.find((check) => check.id === 'typed_data')
    const portal = report.checks.find((check) => check.id === 'portal_rpc')
    const multi = report.checks.find((check) => check.id === 'multi_tenant')
    const liveBackend = report.checks.find((check) => check.id === 'live_backend')

    expect(typed?.ok).toBe(Boolean(liveBackend?.ok))
    expect(portal?.ok).toBe(Boolean(liveBackend?.ok))
    expect(multi?.ok).toBe(Boolean(liveBackend?.ok))
  })
})
