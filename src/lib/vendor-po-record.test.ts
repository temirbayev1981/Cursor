import { describe, it, expect } from 'vitest'
import {
  normalizeVendorPORecord,
  omitOptionalVendorPoFields,
  omitProblemDescriptionFields,
  isMissingVendorPoColumnError,
} from '@/lib/vendor-po-record'
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
  service_description: 'BUILDING EXTERIOR repair',
  work_summary: 'Fence repair',
  problem_description: 'The pole is leaning',
  problem_description_ru: 'Столб наклонён',
  source_file_name: 'VendorPO-210071-01.pdf',
  source_file_hash: 'abc123',
  status: 'parsed',
  created_at: '2026-07-10T12:00:00Z',
}

describe('vendor-po-record', () => {
  it('normalizeVendorPORecord fills null string fields', () => {
    const normalized = normalizeVendorPORecord({
      ...base,
      priority: null as unknown as string,
      work_summary: null as unknown as string,
      order_type: null as unknown as string,
    })
    expect(normalized.priority).toBe('')
    expect(normalized.work_summary).toBe('')
    expect(normalized.order_type).toBe('')
  })

  it('normalizeVendorPORecord backfills problem_description from service_description', () => {
    const normalized = normalizeVendorPORecord({
      ...base,
      problem_description: undefined,
      service_description: 'BUILDING EXTERIOR / The pole in the back is leaning',
    })
    expect(normalized.problem_description).toBe('The pole in the back is leaning')
  })

  it('omitProblemDescriptionFields strips translation fields', () => {
    const stripped = omitProblemDescriptionFields(base)
    expect(stripped).not.toHaveProperty('problem_description')
    expect(stripped).not.toHaveProperty('problem_description_ru')
    expect(stripped.source_file_hash).toBe('abc123')
  })

  it('omitOptionalVendorPoFields strips hash and problem fields', () => {
    const stripped = omitOptionalVendorPoFields(base)
    expect(stripped).not.toHaveProperty('problem_description')
    expect(stripped).not.toHaveProperty('source_file_hash')
    expect(stripped.vendor_po_number).toBe('210071-01')
  })

  it('isMissingVendorPoColumnError detects schema cache errors', () => {
    expect(isMissingVendorPoColumnError("Could not find the 'source_file_hash' column")).toBe(true)
    expect(isMissingVendorPoColumnError('problem_description missing')).toBe(true)
    expect(isMissingVendorPoColumnError('duplicate key value')).toBe(false)
  })
})
