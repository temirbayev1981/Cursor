import { describe, it, expect, beforeEach } from 'vitest'
import {
  clearIntegrationProbeHistory,
  getLatestIntegrationProbeHistory,
  hasIntegrationProbeHistory,
  loadIntegrationProbeHistory,
  saveIntegrationProbeHistory,
} from './integration-probe-history'

describe('integration-probe-history', () => {
  beforeEach(() => {
    clearIntegrationProbeHistory()
  })

  it('saves and loads probe history entries', () => {
    saveIntegrationProbeHistory({ supabase: true })
    expect(hasIntegrationProbeHistory()).toBe(true)
    const latest = getLatestIntegrationProbeHistory()
    expect(latest?.results.supabase).toBe(true)
    expect(latest?.summary.live).toBeGreaterThanOrEqual(0)
  })

  it('keeps at most 10 history entries', () => {
    for (let i = 0; i < 12; i++) {
      saveIntegrationProbeHistory({ supabase: true })
    }
    expect(loadIntegrationProbeHistory()).toHaveLength(10)
  })

  it('clearIntegrationProbeHistory removes stored entries', () => {
    saveIntegrationProbeHistory({ supabase: true })
    clearIntegrationProbeHistory()
    expect(hasIntegrationProbeHistory()).toBe(false)
  })
})
