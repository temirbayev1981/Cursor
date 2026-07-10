import { describe, it, expect } from 'vitest'
import { computePlatformHealth, integrationProbesPass } from './platform-health'

describe('platform-health', () => {
  it('computes weighted platform score', () => {
    const report = computePlatformHealth()
    expect(report.score).toBeGreaterThanOrEqual(0)
    expect(report.score).toBeLessThanOrEqual(10)
    expect(report.checks).toHaveLength(10)
    expect(report.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining(['data_mode', 'pwa', 'offline_sync', 'observability']),
    )
    expect(report.grade).toMatch(/^[A-C]\+?$/)
  })

  it('downgrades integrations when live probe fails', () => {
    const report = computePlatformHealth({
      probeResults: { stripe: false, supabase: true },
    })
    expect(report.checks.find((c) => c.id === 'stripe')?.ok).toBe(false)
  })

  it('integrationProbesPass accepts all reachable probes', () => {
    expect(integrationProbesPass({ stripe: true, maps: null })).toBe(true)
    expect(integrationProbesPass({ stripe: false })).toBe(false)
    expect(integrationProbesPass(undefined)).toBe(true)
  })

  it('downgrades observability when live probe fails', () => {
    const report = computePlatformHealth({
      probeResults: { observability: false },
    })
    expect(report.checks.find((c) => c.id === 'observability')?.ok).toBe(false)
  })

  it('requires supabase for production readiness flag', () => {
    const report = computePlatformHealth()
    if (!report.checks.find((check) => check.id === 'supabase')?.ok) {
      expect(report.readyForProduction).toBe(false)
    }
  })
})
