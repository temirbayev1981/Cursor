import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/env', () => ({
  hasOpenAI: true,
}))

vi.mock('@/lib/openai-proxy-client', () => ({
  callOpenAIProxy: vi.fn(),
}))

import { callOpenAIProxy } from '@/lib/openai-proxy-client'
import {
  translateProblemDescriptionToRussian,
  enrichVendorPOInputWithRussianProblem,
} from './vendor-po-translate'
import type { VendorPOInput } from '@/types/vendor-po'

const callOpenAIProxyMock = vi.mocked(callOpenAIProxy)

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
  beforeEach(() => {
    callOpenAIProxyMock.mockReset()
  })

  it('returns null for empty text', async () => {
    await expect(translateProblemDescriptionToRussian('')).resolves.toBeNull()
    expect(callOpenAIProxyMock).not.toHaveBeenCalled()
  })

  it('calls OpenAI proxy and returns Russian translation', async () => {
    callOpenAIProxyMock.mockResolvedValue('Столб сзади магазина наклонён')

    const ru = await translateProblemDescriptionToRussian('The pole is leaning')
    expect(ru).toBe('Столб сзади магазина наклонён')
    expect(callOpenAIProxyMock).toHaveBeenCalledOnce()
  })

  it('enrichVendorPOInputWithRussianProblem adds problem_description_ru', async () => {
    callOpenAIProxyMock.mockResolvedValue('Столб наклонён')

    const enriched = await enrichVendorPOInputWithRussianProblem(baseInput)
    expect(enriched.problem_description_ru).toBe('Столб наклонён')
  })

  it('enrichVendorPOInputWithRussianProblem skips when Russian already present', async () => {
    const input: VendorPOInput = { ...baseInput, problem_description_ru: 'Уже переведено' }
    const enriched = await enrichVendorPOInputWithRussianProblem(input)
    expect(enriched.problem_description_ru).toBe('Уже переведено')
    expect(callOpenAIProxyMock).not.toHaveBeenCalled()
  })
})
