import { describe, it, expect, beforeEach } from 'vitest'
import { captureError, getErrorReports, getSentryProbeUrl } from './observability'

describe('observability', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('getSentryProbeUrl extracts ingest host from DSN', () => {
    const url = getSentryProbeUrl('https://abc@o123.ingest.sentry.io/456')
    expect(url).toBe('https://o123.ingest.sentry.io/')
  })

  it('captureError saves report to localStorage', () => {
    captureError(new Error('Test failure'))
    const reports = getErrorReports()
    expect(reports).toHaveLength(1)
    expect(reports[0].message).toBe('Test failure')
    expect(reports[0].url).toBeTruthy()
  })

  it('getErrorReports returns empty array when storage is empty', () => {
    expect(getErrorReports()).toEqual([])
  })

  it('stores at most 50 error reports', () => {
    for (let i = 0; i < 55; i++) {
      captureError(new Error(`err-${i}`))
    }
    const reports = getErrorReports()
    expect(reports).toHaveLength(50)
    expect(reports[0].message).toBe('err-54')
  })
})
