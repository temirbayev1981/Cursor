import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/env', () => ({
  hasOpenAI: true,
  getOpenAIEndpoint: () => 'https://example.test/openai-proxy',
  isE2eMockBackend: false,
}))

vi.mock('@/lib/supabase', () => ({
  getSupabaseAuthHeaders: async () => ({ Authorization: 'Bearer test' }),
}))

import { ocrImagesToText } from './pdf-ocr'

describe('pdf-ocr', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null for empty image list', async () => {
    await expect(ocrImagesToText([])).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts images to OpenAI proxy and returns trimmed content', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ content: '  VENDOR PO # 207872-02  \n' }),
    })

    const text = await ocrImagesToText(['data:image/png;base64,abc'])
    expect(text).toBe('VENDOR PO # 207872-02')
    expect(fetchMock).toHaveBeenCalledOnce()
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(String(init.body)) as { images?: string[] }
    expect(body.images).toEqual(['data:image/png;base64,abc'])
  })

  it('returns null when proxy responds with error', async () => {
    fetchMock.mockResolvedValue({ ok: false })
    await expect(ocrImagesToText(['data:image/png;base64,abc'])).resolves.toBeNull()
  })
})
