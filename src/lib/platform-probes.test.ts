import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { probeIntegrationEndpoint, probeLiveIntegrations } from './platform-probes'

describe('platform-probes', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('treats 401/405 as reachable endpoints', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }))
    await expect(probeIntegrationEndpoint('https://example.com/fn')).resolves.toBe(true)
  })

  it('returns false when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network'))
    await expect(probeIntegrationEndpoint('https://example.com/fn')).resolves.toBe(false)
  })

  it('returns probes for all integration keys', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 401 }))
    const probes = await probeLiveIntegrations()
    expect(probes.map((p) => p.id)).toEqual(['stripe', 'supabase', 'openai', 'email', 'sms', 'maps'])
  })
})
