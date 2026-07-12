import { describe, it, expect, beforeEach } from 'vitest'
import {
  listEntities,
  listEntitiesPage,
  saveEntity,
  deleteEntity,
  logAudit,
  createJobFromVendorPO,
  resolveCustomerForVendorPO,
} from './entity-service'
import { isUuid } from '@/lib/is-uuid'
import type { VendorPORecord } from '@/types/vendor-po'
import { STORE_KEYS } from '@/lib/data-store'

describe('entity-service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loads sample jobs scoped to company', async () => {
    const jobs = await listEntities('jobs', 'comp-001')
    expect(jobs.length).toBeGreaterThan(0)
    expect(jobs.every((job) => job.company_id === 'comp-001')).toBe(true)
  })

  it('upserts entity into local store', async () => {
    const job = {
      id: 'job-test-1',
      company_id: 'comp-001',
      customer_id: 'cust-001',
      title: 'Test job',
      description: '',
      status: 'draft' as const,
      priority: 'medium' as const,
      estimated_hours: 1,
      actual_hours: 0,
      revenue: 100,
      labor_cost: 0,
      material_cost: 0,
      fuel_cost: 0,
      overhead_cost: 0,
      profit: 0,
      profit_margin: 0,
      created_at: new Date().toISOString(),
    }
    await saveEntity('jobs', job)
    const jobs = await listEntities('jobs', 'comp-001')
    expect(jobs.some((item) => item.id === 'job-test-1')).toBe(true)
  })

  it('deletes entity from local store', async () => {
    const job = {
      id: 'job-delete-1',
      company_id: 'comp-001',
      customer_id: 'cust-001',
      title: 'Delete me',
      description: '',
      status: 'draft' as const,
      priority: 'low' as const,
      estimated_hours: 1,
      actual_hours: 0,
      revenue: 50,
      labor_cost: 0,
      material_cost: 0,
      fuel_cost: 0,
      overhead_cost: 0,
      profit: 0,
      profit_margin: 0,
      created_at: new Date().toISOString(),
    }
    await saveEntity('jobs', job)
    await deleteEntity('jobs', 'job-delete-1')
    const stored = JSON.parse(localStorage.getItem(STORE_KEYS.jobs) || '[]') as Array<{ id: string }>
    expect(stored.some((item) => item.id === 'job-delete-1')).toBe(false)
  })

  it('listEntitiesPage returns paginated customers from local store', async () => {
    const page1 = await listEntitiesPage('customers', 'comp-001', { page: 1, pageSize: 5 })
    expect(page1.items.length).toBeLessThanOrEqual(5)
    expect(page1.total).toBeGreaterThan(0)
    expect(page1.page).toBe(1)
    expect(page1.pageSize).toBe(5)
  })

  it('listEntitiesPage filters customers by search', async () => {
    const all = await listEntities('customers', 'comp-001')
    const target = all[0]
    const page = await listEntitiesPage('customers', 'comp-001', {
      page: 1,
      pageSize: 25,
      search: target.name.slice(0, 4),
    })
    expect(page.items.some((row) => row.id === target.id)).toBe(true)
    expect(page.total).toBeGreaterThan(0)
  })

  it('listEntitiesPage filters jobs by status', async () => {
    const page = await listEntitiesPage('jobs', 'comp-001', {
      page: 1,
      pageSize: 25,
      status: 'completed',
    })
    expect(page.items.every((job) => job.status === 'completed')).toBe(true)
  })

  it('listEntitiesPage paginates invoices by page number', async () => {
    const page1 = await listEntitiesPage('invoices', 'comp-001', { page: 1, pageSize: 2 })
    const page2 = await listEntitiesPage('invoices', 'comp-001', { page: 2, pageSize: 2 })
    if (page1.total > 2) {
      expect(page2.items[0]?.id).not.toBe(page1.items[0]?.id)
    }
    expect(page1.pageSize).toBe(2)
  })

  it('listEntitiesPage paginates estimates, expenses, and materials', async () => {
    const estimates = await listEntitiesPage('estimates', 'comp-001', { page: 1, pageSize: 5 })
    expect(estimates.total).toBeGreaterThan(0)
    expect(estimates.items.length).toBeLessThanOrEqual(5)

    const expenses = await listEntitiesPage('expenses', 'comp-001', { page: 1, pageSize: 5 })
    expect(expenses.total).toBeGreaterThan(0)

    const materials = await listEntitiesPage('materials', 'comp-001', { page: 1, pageSize: 5 })
    expect(materials.total).toBeGreaterThan(0)
    expect(materials.items.every((row) => row.company_id === 'comp-001')).toBe(true)
  })

  it('listEntitiesPage clears stale cache when unfiltered first page is empty', async () => {
    const staleEstimate = {
      id: 'est-stale-cache',
      company_id: 'comp-empty-page',
      customer_id: 'cust-001',
      job_id: null,
      title: 'Stale estimate',
      status: 'draft' as const,
      labor_hours: 1,
      labor_rate: 75,
      material_cost: 0,
      total: 75,
      valid_until: new Date().toISOString(),
      line_items: [],
      created_at: new Date().toISOString(),
    }
    localStorage.setItem(STORE_KEYS.estimates, JSON.stringify([staleEstimate]))

    const page = await listEntitiesPage('estimates', 'comp-empty-page', { page: 1, pageSize: 25 })
    expect(page.total).toBe(0)
    expect(page.items).toEqual([])

    const cached = JSON.parse(localStorage.getItem(STORE_KEYS.estimates) || '[]') as Array<{ company_id: string }>
    expect(cached.filter((row) => row.company_id === 'comp-empty-page')).toHaveLength(0)
  })

  it('resolveCustomerForVendorPO auto-creates customer when only demo ids exist', async () => {
    const po: VendorPORecord = {
      id: 'po-test-1',
      company_id: 'comp-empty',
      vendor_po_number: '207872-99',
      client_po_number: '350531955',
      priority: 'P5',
      order_type: 'REPAIR',
      nte_amount: 115,
      client_company: 'CD Maintenance',
      client_contact: 'Max',
      client_phone: '555-0100',
      client_email: 'test@example.com',
      client_address: '2170 W State Road',
      service_location_name: 'Walgreen Drug Store #09236',
      service_address: '3703 Lawndale Dr',
      service_city: 'Greensboro',
      service_state: 'NC',
      service_zip: '27403',
      service_phone: '555-0101',
      vendor_name: 'ReadyFix',
      vendor_address: '929 15th St',
      vendor_phone: '555-0102',
      service_category: 'Bell',
      service_description: 'Drive thru sensor bell repair',
      work_summary: 'Bell sensor repair',
      source_file_name: 'walgreens.pdf',
      status: 'parsed',
      created_at: new Date().toISOString(),
    }

    const customerId = await resolveCustomerForVendorPO(po, 'comp-empty')
    expect(isUuid(customerId)).toBe(true)

    const customers = await listEntities('customers', 'comp-empty')
    expect(customers.some((customer) => customer.id === customerId)).toBe(true)
  })

  it('createJobFromVendorPO uses uuid customer id', async () => {
    const po: VendorPORecord = {
      id: 'po-test-2',
      company_id: 'comp-job',
      vendor_po_number: '207872-98',
      client_po_number: '350531956',
      priority: 'P5',
      order_type: 'REPAIR',
      nte_amount: 115,
      client_company: 'CD Maintenance',
      client_contact: 'Max',
      client_phone: '555-0100',
      client_email: 'test@example.com',
      client_address: '2170 W State Road',
      service_location_name: 'Walgreen',
      service_address: '3703 Lawndale Dr',
      service_city: 'Greensboro',
      service_state: 'NC',
      service_zip: '27403',
      service_phone: '555-0101',
      vendor_name: 'ReadyFix',
      vendor_address: '929 15th St',
      vendor_phone: '555-0102',
      service_category: 'Bell',
      service_description: 'Drive thru sensor bell repair',
      work_summary: 'Bell sensor repair',
      source_file_name: 'walgreens2.pdf',
      status: 'parsed',
      created_at: new Date().toISOString(),
    }

    const job = await createJobFromVendorPO(po, 'comp-job')
    expect(isUuid(job.customer_id)).toBe(true)
    expect(job.status).toBe('draft')
    expect(job.title).toContain('REPAIR')
  })

  it('trims audit log cache to 500 entries', async () => {
    for (let i = 0; i < 505; i++) {
      await logAudit('comp-001', 'user-001', 'test.action', 'job', `job-${i}`)
    }
    const logs = JSON.parse(localStorage.getItem(STORE_KEYS.auditLogs) || '[]') as unknown[]
    expect(logs.length).toBeLessThanOrEqual(500)
  })

  it('listEntities returns empty when server has no rows (no stale cache)', async () => {
    const staleJob = {
      id: 'job-stale-cache',
      company_id: 'comp-empty-list',
      customer_id: 'cust-001',
      title: 'Stale cached job',
      description: '',
      status: 'draft' as const,
      priority: 'low' as const,
      estimated_hours: 1,
      actual_hours: 0,
      revenue: 0,
      labor_cost: 0,
      material_cost: 0,
      fuel_cost: 0,
      overhead_cost: 0,
      profit: 0,
      profit_margin: 0,
      created_at: new Date().toISOString(),
    }
    localStorage.setItem(STORE_KEYS.jobs, JSON.stringify([staleJob]))

    const jobs = await listEntities('jobs', 'comp-empty-list')
    expect(jobs).toEqual([])

    const cached = JSON.parse(localStorage.getItem(STORE_KEYS.jobs) || '[]') as Array<{ company_id: string }>
    expect(cached.filter((j) => j.company_id === 'comp-empty-list')).toHaveLength(0)
  })
})
