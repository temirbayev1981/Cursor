import { describe, it, expect, beforeEach } from 'vitest'
import {
  listEntities,
  listEntitiesPage,
  listFuelLogsPage,
  getFuelLogsSummary,
  getExpensesSummary,
  getInvoicesSummary,
  fetchInvoiceById,
  getMaterialsSummary,
  listCustomerContacts,
  getSmartEngineJobContext,
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

  it('listFuelLogsPage returns paginated fuel logs for company vehicles', async () => {
    const page = await listFuelLogsPage('comp-001', { page: 1, pageSize: 5 })
    expect(page.total).toBeGreaterThan(0)
    expect(page.items.length).toBeLessThanOrEqual(5)
    expect(page.items.every((log) => typeof log.vehicle_id === 'string')).toBe(true)
  })

  it('getFuelLogsSummary and getExpensesSummary return KPI totals', async () => {
    const fuel = await getFuelLogsSummary('comp-001')
    expect(fuel.totalCost).toBeGreaterThan(0)
    expect(fuel.totalMiles).toBeGreaterThan(0)

    const expenses = await getExpensesSummary('comp-001')
    expect(expenses.totalAmount).toBeGreaterThan(0)
    expect(expenses.count).toBeGreaterThan(0)
  })

  it('getInvoicesSummary returns outstanding and paid-this-month totals', async () => {
    const summary = await getInvoicesSummary('comp-001')
    expect(summary.outstanding).toBeGreaterThanOrEqual(0)
    expect(summary.paidThisMonth).toBeGreaterThanOrEqual(0)
  })

  it('fetchInvoiceById returns a single invoice without listing all', async () => {
    const invoices = await listEntitiesPage('invoices', 'comp-001', { page: 1, pageSize: 1 })
    expect(invoices.items.length).toBeGreaterThan(0)
    const invoice = await fetchInvoiceById('comp-001', invoices.items[0].id)
    expect(invoice?.id).toBe(invoices.items[0].id)
  })

  it('getMaterialsSummary returns low-stock items and name map', async () => {
    const summary = await getMaterialsSummary('comp-001')
    expect(Object.keys(summary.names).length).toBeGreaterThan(0)
    expect(summary.lowStock.every((m) => m.quantity <= m.reorder_level)).toBe(true)
  })

  it('listCustomerContacts returns picker fields without full CRM rows', async () => {
    const contacts = await listCustomerContacts('comp-001')
    expect(contacts.length).toBeGreaterThan(0)
    expect(contacts[0]).toHaveProperty('name')
    expect(contacts[0]).toHaveProperty('email')
    expect(contacts[0]).not.toHaveProperty('total_revenue')
  })

  it('getSmartEngineJobContext returns drywall stats and job count', async () => {
    const context = await getSmartEngineJobContext('comp-001')
    expect(context.totalJobs).toBeGreaterThan(0)
    expect(context.drywallStats.every((job) => typeof job.estimated_hours === 'number')).toBe(true)
  })

  it('listFuelLogsPage clears stale scoped cache when remote total is zero', async () => {
    const vehicle = {
      id: 'veh-empty-fuel',
      company_id: 'comp-empty-fuel',
      name: 'Test Van',
      type: 'van' as const,
      make: 'Ford',
      model: 'Transit',
      year: 2022,
      license_plate: 'TST-0001',
      mileage: 1000,
      is_active: true,
      created_at: new Date().toISOString(),
    }
    await saveEntity('vehicles', vehicle)

    const staleLog = {
      id: 'fuel-stale-cache',
      vehicle_id: 'veh-empty-fuel',
      date: new Date().toISOString(),
      miles: 10,
      gallons: 1,
      fuel_price: 3.5,
      total_cost: 3.5,
    }
    localStorage.setItem(STORE_KEYS.fuelLogs, JSON.stringify([staleLog]))

    const page = await listFuelLogsPage('comp-empty-fuel', { page: 1, pageSize: 25 })
    expect(page.total).toBe(0)
    expect(page.items).toEqual([])

    const cached = JSON.parse(localStorage.getItem(STORE_KEYS.fuelLogs) || '[]') as Array<{ vehicle_id: string }>
    expect(cached.filter((row) => row.vehicle_id === 'veh-empty-fuel')).toHaveLength(0)
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
