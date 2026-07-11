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

import { canExtractPdfOnServer, extractTextFromPdfServer } from '@/lib/pdf-extract-server'

describe('pdf-extract-server', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('canExtractPdfOnServer is true when endpoint configured', () => {
    expect(canExtractPdfOnServer()).toBe(true)
  })

  it('extractTextFromPdfServer posts extractPdf to openai-proxy first', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ text: 'VENDOR PO # 210379-01' }), { status: 200 }),
    )

    const file = new File(['%PDF-1.4 mock'], 'VendorPO-210379-01.pdf', { type: 'application/pdf' })
    const text = await extractTextFromPdfServer(file)

    expect(text).toContain('210379-01')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.test/functions/v1/openai-proxy',
      expect.objectContaining({ method: 'POST' }),
    )
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    expect(body.extractPdf).toBe(true)
    expect(body.pdfBase64).toBeTruthy()
  })

  it('falls back to extract-pdf-text when openai-proxy fails', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'not found' }), { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ text: 'VENDOR PO # 210379-01' }), { status: 200 }))

    const file = new File(['%PDF-1.4 mock'], 'VendorPO-210379-01.pdf', { type: 'application/pdf' })
    const text = await extractTextFromPdfServer(file)

    expect(text).toContain('210379-01')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('extract-pdf-text')
  })
})
