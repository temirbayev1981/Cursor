import { describe, it, expect } from 'vitest'
import { computePlatformAudit } from './platform-audit'

describe('platform-audit', () => {
  it('returns combined audit score and recommendations', () => {
    const report = computePlatformAudit()
    expect(report.score).toBeGreaterThanOrEqual(0)
    expect(report.score).toBeLessThanOrEqual(10)
    expect(report.integrationScore).toBeGreaterThanOrEqual(0)
    expect(report.qualityScore).toBeGreaterThanOrEqual(0)
    expect(report.recommendations.length).toBeGreaterThan(0)
    expect(report.summary.length).toBeGreaterThan(10)
    expect(report.grade).toMatch(/^[A-C][+-]?$/)
  })

  it('recommends observability when unset', () => {
    const report = computePlatformAudit()
    expect(report.recommendations.some((r) => /sentry|error webhook|мониторинг/i.test(r))).toBe(true)
  })
})
