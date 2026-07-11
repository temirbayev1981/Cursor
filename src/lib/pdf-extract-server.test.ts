import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/env', () => ({
  hasSupabase: true,
  isE2eMockBackend: false,
  getOpenAIEndpoint: () => 'https://example.test/functions/v1/openai-proxy',
  getExtractPdfEndpoint: () => 'https://example.test/functions/v1/extract-pdf-text',
}))

vi.mock('@/lib/supabase', () => ({
  getSupabaseAuthHeaders: async () => ({
    Authorization: 'Bearer test',
    apikey: 'anon-test',
    'Content-Type': 'application/json',
  }),
}))

import {
  canExtractPdfOnServer,
  extractTextFromPdfServer,
  isServerPdfExtractAvailable,
} from '@/lib/pdf-extract-server'

describe('pdf-extract-server', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
  })

  it('canExtractPdfOnServer is true when endpoint configured', () => {
    expect(canExtractPdfOnServer()).toBe(true)
  })

  it('isServerPdfExtractAvailable returns false on 404 and caches result', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ code: 'NOT_FOUND', message: 'Requested function was not found' }), { status: 404 }),
    )
    await expect(isServerPdfExtractAvailable()).resolves.toBe(false)
    await expect(isServerPdfExtractAvailable()).resolves.toBe(false)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('extractTextFromPdfServer posts pdfBase64 to extract-pdf-text', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ text: 'VENDOR PO # 210379-01' }), { status: 200 }),
    )

    const file = new File(['%PDF-1.4 mock'], 'VendorPO-210379-01.pdf', { type: 'application/pdf' })
    const text = await extractTextFromPdfServer(file)

    expect(text).toContain('210379-01')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.test/functions/v1/extract-pdf-text',
      expect.objectContaining({ method: 'POST' }),
    )
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    expect(body.pdfBase64).toBeTruthy()
    expect(body.extractPdf).toBeUndefined()
  })
})
