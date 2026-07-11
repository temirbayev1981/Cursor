import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/env', () => ({
  hasSupabase: true,
  isE2eMockBackend: false,
  getExtractPdfEndpoint: () => 'https://example.test/functions/v1/extract-pdf-text',
}))

vi.mock('@/lib/supabase', () => ({
  getSupabaseAuthHeaders: async () => ({
    Authorization: 'Bearer test',
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

  it('extractTextFromPdfServer posts base64 PDF and returns text', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ text: 'VENDOR PO # 210150-01' }), { status: 200 }),
    )

    const file = new File(['%PDF-1.4 mock'], 'VendorPO-210150-01.pdf', { type: 'application/pdf' })
    const text = await extractTextFromPdfServer(file)

    expect(text).toContain('210150-01')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.test/functions/v1/extract-pdf-text',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
