import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { getSession, refreshSession, invoke } = vi.hoisted(() => ({
  getSession: vi.fn(),
  refreshSession: vi.fn(),
  invoke: vi.fn(),
}))

vi.mock('@/lib/env', () => ({
  hasOpenAI: true,
  getOpenAIEndpoint: () => 'https://example.test/functions/v1/openai-proxy',
  isE2eMockBackend: false,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession, refreshSession },
    functions: { invoke },
  },
  getSupabaseAuthHeaders: async () => ({
    Authorization: 'Bearer user-jwt',
    apikey: 'anon-key',
    'Content-Type': 'application/json',
  }),
}))

import { callOpenAIProxy, ensureSupabaseSession } from './openai-proxy-client'

describe('openai-proxy-client', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    getSession.mockReset()
    refreshSession.mockReset()
    invoke.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('ensureSupabaseSession returns true when session exists', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'token' } } })
    await expect(ensureSupabaseSession()).resolves.toBe(true)
    expect(refreshSession).not.toHaveBeenCalled()
  })

  it('ensureSupabaseSession refreshes missing session', async () => {
    getSession.mockResolvedValue({ data: { session: null } })
    refreshSession.mockResolvedValue({ data: { session: { access_token: 'fresh' } }, error: null })
    await expect(ensureSupabaseSession()).resolves.toBe(true)
    expect(refreshSession).toHaveBeenCalledOnce()
  })

  it('callOpenAIProxy prefers functions.invoke', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'token' } } })
    invoke.mockResolvedValue({ data: { content: '  Столб наклонён  ' }, error: null })

    const result = await callOpenAIProxy({ system: 's', user: 'The pole is leaning' })
    expect(result).toBe('Столб наклонён')
    expect(invoke).toHaveBeenCalledOnce()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('callOpenAIProxy falls back to fetch when invoke fails', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'token' } } })
    invoke.mockResolvedValue({ data: null, error: new Error('invoke failed') })
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'Дверь сломана' }),
    })

    const result = await callOpenAIProxy({ system: 's', user: 'Broken door' })
    expect(result).toBe('Дверь сломана')
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
