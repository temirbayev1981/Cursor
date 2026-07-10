import { describe, it, expect } from 'vitest'
import { computePlatformHealth } from './platform-health'

describe('platform-health', () => {
  it('computes weighted platform score', () => {
    const report = computePlatformHealth()
    expect(report.score).toBeGreaterThanOrEqual(0)
    expect(report.score).toBeLessThanOrEqual(10)
    expect(report.checks).toHaveLength(9)
    expect(report.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining(['data_mode', 'pwa', 'tech_link']),
    )
    expect(report.grade).toMatch(/^[A-C]\+?$/)
  })

  it('requires supabase for production readiness flag', () => {
    const report = computePlatformHealth()
    if (!report.checks.find((check) => check.id === 'supabase')?.ok) {
      expect(report.readyForProduction).toBe(false)
    }
  })
})
