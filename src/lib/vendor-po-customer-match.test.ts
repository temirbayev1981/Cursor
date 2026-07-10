import { describe, it, expect } from 'vitest'
import { matchCustomerFromVendorPO } from '@/lib/vendor-po-customer-match'
import type { Customer } from '@/types'

const customers: Customer[] = [
  {
    id: 'cust-001',
    company_id: 'comp-001',
    name: 'ABC Property Management',
    email: 'workorders@abcprop.com',
    phone: '(555) 234-5678',
    address: '500 Commerce St, Austin, TX',
    type: 'property_management',
    total_revenue: 0,
    job_count: 0,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cust-002',
    company_id: 'comp-001',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '(555) 345-6789',
    address: '789 Oak Lane, Austin, TX',
    type: 'residential',
    total_revenue: 0,
    job_count: 0,
    created_at: '2024-01-01T00:00:00Z',
  },
]

describe('matchCustomerFromVendorPO', () => {
  it('matches by email', () => {
    const match = matchCustomerFromVendorPO(
      { client_company: 'Unknown', client_email: 'sarah.j@email.com', client_phone: '', client_address: '', service_address: '' },
      customers
    )
    expect(match?.id).toBe('cust-002')
  })

  it('matches property management for vendor PO without direct name match', () => {
    const match = matchCustomerFromVendorPO(
      { client_company: 'CD Maintenance Company', client_email: '', client_phone: '', client_address: '', service_address: '317 Main St' },
      customers
    )
    expect(match?.id).toBe('cust-001')
  })

  it('matches by fuzzy company name', () => {
    const match = matchCustomerFromVendorPO(
      { client_company: 'ABC Property', client_email: '', client_phone: '', client_address: '', service_address: '' },
      customers
    )
    expect(match?.id).toBe('cust-001')
  })
})
