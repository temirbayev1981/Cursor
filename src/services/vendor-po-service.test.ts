import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getVendorPOs,
  saveVendorPO,
  saveVendorPOBatch,
  deleteVendorPO,
  VendorPoDuplicateError,
  isVendorPoDuplicateError,
} from './vendor-po-service'
import type { VendorPOInput } from '@/types/vendor-po'

vi.mock('@/lib/supabase', () => ({
  supabase: null,
}))

const COMPANY_ID = 'comp-vendor-test'

const sampleInput: VendorPOInput = {
  company_id: COMPANY_ID,
  vendor_po_number: '207872-02',
  client_po_number: '350531955',
  priority: 'P30',
  order_type: 'REPLACE',
  nte_amount: 115,
  client_company: 'CD Maintenance',
  client_contact: 'Max',
  client_phone: '555-0100',
  client_email: 'test@example.com',
  client_address: '2170 W State Road',
  service_location_name: 'Walgreen',
  service_address: '317 Main St',
  service_city: 'Graham',
  service_state: 'NC',
  service_zip: '27253',
  service_phone: '555-0101',
  vendor_name: 'ReadyFix',
  vendor_address: '929 15th St',
  vendor_phone: '555-0102',
  service_category: 'Ceiling',
  service_description: 'Replace ceiling tile',
  work_summary: 'Ceiling tile replace',
  source_file_name: 'test.pdf',
  status: 'parsed',
}

describe('vendor-po-service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and lists vendor POs locally when Supabase is unavailable', async () => {
    const saved = await saveVendorPO(sampleInput)
    expect(saved.vendor_po_number).toBe('207872-02')
    const list = await getVendorPOs(COMPANY_ID)
    expect(list).toHaveLength(1)
    expect(list[0]?.id).toBe(saved.id)
  })

  it('rejects duplicate vendor PO numbers for the same company', async () => {
    await saveVendorPO(sampleInput)
    await expect(saveVendorPO({ ...sampleInput, work_summary: 'Updated summary' }))
      .rejects
      .toBeInstanceOf(VendorPoDuplicateError)
    const list = await getVendorPOs(COMPANY_ID)
    expect(list).toHaveLength(1)
    expect(list[0]?.work_summary).toBe('Ceiling tile replace')
    expect(isVendorPoDuplicateError(new VendorPoDuplicateError('207872-02'))).toBe(true)
  })

  it('saveVendorPOBatch saves multiple records', async () => {
    const batch = await saveVendorPOBatch([
      sampleInput,
      { ...sampleInput, vendor_po_number: '207872-03' },
    ])
    expect(batch).toHaveLength(2)
    const list = await getVendorPOs(COMPANY_ID)
    expect(list).toHaveLength(2)
  })

  it('deleteVendorPO removes a local record', async () => {
    const saved = await saveVendorPO(sampleInput)
    await deleteVendorPO(saved.id)
    const list = await getVendorPOs(COMPANY_ID)
    expect(list).toHaveLength(0)
  })
})
