import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/env', () => ({
  hasStripe: false,
  hasSupabase: true,
  hasOpenAI: false,
  hasNotificationConfigured: false,
  hasSmsConfigured: false,
  hasGoogleMaps: false,
  hasObservability: false,
  isE2eMockBackend: true,
}))

import {
  buildSyntheticE2eProbes,
  integrationProbeUiReady,
  probesToRecord,
  summarizeIntegrationProbes,
} from './integration-probe-ui'

describe('integration-probe-ui', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('buildSyntheticE2eProbes marks configured integrations reachable', () => {
    const probes = buildSyntheticE2eProbes()
    const map = probesToRecord(probes)
    expect(map.supabase).toBe(true)
    expect(map.stripe).toBeNull()
  })

  it('summarizeIntegrationProbes counts live integrations', () => {
    const summary = summarizeIntegrationProbes({ supabase: true })
    expect(summary.live).toBe(1)
    expect(summary.total).toBe(1)
    expect(summary.unreachable).toBe(0)
  })

  it('integrationProbeUiReady requires probed configured integrations', () => {
    expect(integrationProbeUiReady({ supabase: true })).toBe(true)
    expect(integrationProbeUiReady({})).toBe(false)
    expect(integrationProbeUiReady(undefined)).toBe(false)
  })
})
