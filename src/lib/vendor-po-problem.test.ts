import { describe, it, expect } from 'vitest'
import {
  getProblemDescriptionCell,
  getProblemDescriptionEn,
  getProblemDescriptionRu,
  needsProblemDescriptionTranslation,
} from '@/lib/vendor-po-problem'
import type { VendorPORecord } from '@/types/vendor-po'

const base: VendorPORecord = {
  id: 'vpo-1',
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
  service_description: 'BUILDING EXTERIOR / The pole is leaning',
  work_summary: 'Fence repair',
  problem_description: 'The pole is leaning',
  source_file_name: 'VendorPO-210071-01.pdf',
  status: 'parsed',
  created_at: '2026-07-10T12:00:00Z',
}

describe('vendor-po-problem', () => {
  it('getProblemDescriptionEn prefers problem_description field', () => {
    expect(getProblemDescriptionEn(base)).toBe('The pole is leaning')
  })

  it('getProblemDescriptionRu returns stored or in-memory translation only', () => {
    expect(getProblemDescriptionRu(base)).toBe('')
    expect(getProblemDescriptionRu(base, 'Столб наклонён')).toBe('Столб наклонён')
    expect(getProblemDescriptionRu({ ...base, problem_description_ru: 'Столб наклонён' })).toBe('Столб наклонён')
  })

  it('needsProblemDescriptionTranslation detects English without Russian', () => {
    expect(needsProblemDescriptionTranslation(base)).toBe(true)
    expect(needsProblemDescriptionTranslation({ ...base, problem_description_ru: 'Столб' })).toBe(false)
    expect(needsProblemDescriptionTranslation({ ...base, problem_description: '', service_description: 'REPLACE' })).toBe(false)
  })

  it('getProblemDescriptionCell falls back to English when Russian is missing', () => {
    expect(getProblemDescriptionCell(base)).toEqual({
      text: 'The pole is leaning',
      state: 'en',
      isTranslating: false,
    })
  })

  it('getProblemDescriptionCell prefers Russian and marks translating state', () => {
    expect(getProblemDescriptionCell({ ...base, problem_description_ru: 'Столб наклонён' })).toEqual({
      text: 'Столб наклонён',
      state: 'ru',
      isTranslating: false,
    })
    expect(getProblemDescriptionCell(base, { isTranslating: true })).toEqual({
      text: 'The pole is leaning',
      state: 'en',
      isTranslating: true,
    })
  })
})
