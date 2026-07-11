import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/env', () => ({
  hasOpenAI: true,
  getOpenAIEndpoint: () => 'https://example.test/openai-proxy',
  isE2eMockBackend: false,
}))

vi.mock('@/lib/supabase', () => ({
  getSupabaseAuthHeaders: async () => ({ Authorization: 'Bearer test' }),
}))

import {
  translateProblemDescriptionToRussian,
  enrichVendorPOInputWithRussianProblem,
} from './vendor-po-translate'
import type { VendorPOInput } from '@/types/vendor-po'

const baseInput: VendorPOInput = {
  company_id: 'comp-1',
  vendor_po_number: '210071-01',
  client_po_number: '355715102',
  priority: 'P30',
  order_type: 'REPAIR',
  nte_amount: 115,
  client_company: 'CD Maintenance',
  client_contact: 'Max',
  client_phone: '555',
  client_email: 'a@b.com',
  client_address: 'addr',
  service_location_name: 'Walgreen',
  service_address: '123 Main',
  service_city: 'Burlington',
  service_state: 'NC',
  service_zip: '27215',
  service_phone: '555',
  vendor_name: 'ReadyFix',
  vendor_address: '929 15th',
  vendor_phone: '555',
  service_category: 'Exterior',
  service_description: 'BUILDING EXTERIOR / The pole in the back of the store is leaning',
  work_summary: 'Fence repair',
  problem_description: 'The pole in the back of the store is leaning',
  source_file_name: 'VendorPO-210071-01.pdf',
}

describe('vendor-po-translate', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null for empty text', async () => {
    await expect(translateProblemDescriptionToRussian('')).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts English text to OpenAI proxy and returns Russian translation', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ content: '  Столб сзади магазина наклонён  ' }),
    })

    const ru = await translateProblemDescriptionToRussian('The pole is leaning')
    expect(ru).toBe('Столб сзади магазина наклонён')
    expect(fetchMock).toHaveBeenCalledOnce()
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(String(init.body)) as { user?: string; model?: string }
    expect(body.user).toBe('The pole is leaning')
    expect(body.model).toBe('gpt-4o-mini')
  })

  it('returns null when proxy responds with error', async () => {
    fetchMock.mockResolvedValue({ ok: false })
    await expect(translateProblemDescriptionToRussian('Broken door')).resolves.toBeNull()
  })

  it('enrichVendorPOInputWithRussianProblem adds problem_description_ru', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'Столб наклонён' }),
    })

    const enriched = await enrichVendorPOInputWithRussianProblem(baseInput)
    expect(enriched.problem_description_ru).toBe('Столб наклонён')
  })

  it('enrichVendorPOInputWithRussianProblem skips when Russian already present', async () => {
    const input: VendorPOInput = { ...baseInput, problem_description_ru: 'Уже переведено' }
    const enriched = await enrichVendorPOInputWithRussianProblem(input)
    expect(enriched.problem_description_ru).toBe('Уже переведено')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
