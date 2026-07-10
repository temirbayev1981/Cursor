import { describe, it, expect } from 'vitest'
import { groupVendorPOsByAddress, isNTEExceeded } from '@/lib/export'
import type { VendorPORecord } from '@/types/vendor-po'

const baseRecord: VendorPORecord = {
  id: 'po-1',
  company_id: 'c1',
  vendor_po_number: 'VPO-001',
  client_po_number: 'CPO-001',
  priority: 'normal',
  order_type: 'service',
  nte_amount: 500,
  client_company: 'Acme',
  client_contact: 'Jane',
  client_phone: '555-0100',
  client_email: 'jane@acme.test',
  client_address: '1 Acme Way',
  service_location_name: 'Lobby',
  location_number: '1',
  service_address: '123 Main St',
  service_city: 'Austin',
  service_state: 'TX',
  service_zip: '78701',
  service_phone: '555-0100',
  vendor_name: 'ReadyFix',
  vendor_address: '2 Vendor Rd',
  vendor_phone: '555-0200',
  service_category: 'HVAC',
  service_description: 'Repair',
  work_summary: 'HVAC repair',
  source_file_name: 'po.xlsx',
  status: 'parsed',
  created_at: '2026-01-01T00:00:00.000Z',
}

describe('export', () => {
  it('groups vendor POs by service address', () => {
    const other = {
      ...baseRecord,
      id: 'po-2',
      vendor_po_number: 'VPO-002',
      service_address: '456 Oak Ave',
      service_city: 'Austin',
    }
    const groups = groupVendorPOsByAddress([baseRecord, other, { ...baseRecord, id: 'po-3', vendor_po_number: 'VPO-003' }])
    expect(groups.size).toBe(2)
    expect(groups.get('123 Main St, Austin, TX')).toHaveLength(2)
    expect(groups.get('456 Oak Ave, Austin, TX')).toHaveLength(1)
  })

  it('detects when estimate exceeds NTE', () => {
    expect(isNTEExceeded(1000, 1200)).toBe(true)
    expect(isNTEExceeded(1000, 800)).toBe(false)
    expect(isNTEExceeded(0, 5000)).toBe(false)
  })
})
