import type { Job, Customer, Estimate, Invoice, Property, Employee, Material, Vehicle, Expense, ScheduleEvent, WorkOrder, ServiceCatalogItem, FuelLog, Payment, TimeEntry } from '@/types'
import { loadStore, saveStore, upsertStore, removeFromStore, filterByCompany, mergeStoreById, replaceCompanyInStore, replaceScopedInStore, STORE_KEYS } from '@/lib/data-store'
import { matchCustomerFromVendorPO } from '@/lib/vendor-po-customer-match'
import { isUuid } from '@/lib/is-uuid'
import { getErrorMessage } from '@/lib/error-message'
import { JobCreateCustomerError, toJobCreateCustomerError } from '@/lib/job-create-errors'
import { supabase } from '@/lib/supabase'
import { insertRows, upsertRows, type TableInsert, type TableRow } from '@/lib/supabase-queries'
import { ENTITY_LIST_LIMIT, ENTITY_PAGE_SIZE_MAX, type EntityListPageParams, type EntityListPageResult } from '@/lib/entity-limits'

type EntityTable =
  | 'jobs'
  | 'customers'
  | 'estimates'
  | 'invoices'
  | 'properties'
  | 'employees'
  | 'materials'
  | 'vehicles'
  | 'expenses'
  | 'schedule_events'
  | 'work_orders'
  | 'service_catalog'

type EntityMap = {
  jobs: Job
  customers: Customer
  estimates: Estimate
  invoices: Invoice
  properties: Property
  employees: Employee
  materials: Material
  vehicles: Vehicle
  expenses: Expense
  schedules: ScheduleEvent
  workOrders: WorkOrder
  services: ServiceCatalogItem
}

const KEY_MAP: Record<keyof EntityMap, string> = {
  jobs: STORE_KEYS.jobs,
  customers: STORE_KEYS.customers,
  estimates: STORE_KEYS.estimates,
  invoices: STORE_KEYS.invoices,
  properties: STORE_KEYS.properties,
  employees: STORE_KEYS.employees,
  materials: STORE_KEYS.materials,
  vehicles: STORE_KEYS.vehicles,
  expenses: STORE_KEYS.expenses,
  schedules: STORE_KEYS.schedules,
  workOrders: STORE_KEYS.workOrders,
  services: STORE_KEYS.services,
}

const TABLE_MAP: Record<keyof EntityMap, EntityTable> = {
  jobs: 'jobs',
  customers: 'customers',
  estimates: 'estimates',
  invoices: 'invoices',
  properties: 'properties',
  employees: 'employees',
  materials: 'materials',
  vehicles: 'vehicles',
  expenses: 'expenses',
  schedules: 'schedule_events',
  workOrders: 'work_orders',
  services: 'service_catalog',
}

function warnSupabaseFallback(scope: string, err: unknown): void {
  console.warn(`[entity-service] ${scope}: using local cache —`, getErrorMessage(err))
}

async function fetchCompanyEntities<T>(table: EntityTable, companyId: string): Promise<T[]> {
  const { data, error } = await supabase!
    .from(table)
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(ENTITY_LIST_LIMIT)

  if (error) throw error
  return (data ?? []) as T[]
}

async function upsertCompanyEntity<T extends EntityTable>(
  table: T,
  item: TableInsert<T>,
): Promise<TableRow<T>> {
  const payload = table === 'materials'
    ? (({ customer_price: _generated, ...rest }) => rest)(item as TableInsert<'materials'> & { customer_price?: number })
    : item

  const { data, error } = await upsertRows(table, payload as TableInsert<T>)
    .select()
    .single()

  if (error) throw error
  return data as unknown as TableRow<T>
}

async function deleteCompanyEntity(table: EntityTable, id: string): Promise<void> {
  const { error } = await supabase!.from(table).delete().eq('id', id)
  if (error) throw error
}

function loadLocalEntities<K extends keyof EntityMap>(entity: K, companyId: string): EntityMap[K][] {
  return filterByCompany(loadStore<EntityMap[K]>(KEY_MAP[entity]), companyId)
}

export async function listEntities<K extends keyof EntityMap>(entity: K, companyId: string): Promise<EntityMap[K][]> {
  if (!supabase) throw new Error('Supabase not configured')

  try {
    const items = await fetchCompanyEntities<EntityMap[K]>(TABLE_MAP[entity], companyId)
    replaceCompanyInStore(KEY_MAP[entity], companyId, items)
    return items
  } catch (err) {
    warnSupabaseFallback(`listEntities(${entity})`, err)
    return loadLocalEntities(entity, companyId)
  }
}

type PageableEntity = 'customers' | 'jobs' | 'invoices' | 'estimates' | 'expenses' | 'materials'

const PAGE_ENTITY_CONFIG: Record<
  PageableEntity,
  { searchColumn: string; statusColumn?: string; localSearch: (row: EntityMap[PageableEntity]) => string }
> = {
  customers: { searchColumn: 'name', localSearch: (row) => (row as Customer).name },
  jobs: { searchColumn: 'title', statusColumn: 'status', localSearch: (row) => (row as Job).title },
  invoices: { searchColumn: 'invoice_number', localSearch: (row) => (row as Invoice).invoice_number },
  estimates: { searchColumn: 'title', statusColumn: 'status', localSearch: (row) => (row as Estimate).title },
  expenses: { searchColumn: 'description', localSearch: (row) => (row as Expense).description },
  materials: { searchColumn: 'name', localSearch: (row) => (row as Material).name },
}

function filterLocalPageEntities<K extends PageableEntity>(
  entity: K,
  items: EntityMap[K][],
  params: EntityListPageParams,
): EntityMap[K][] {
  let filtered = [...items]
  const search = params.search?.trim().toLowerCase()
  const config = PAGE_ENTITY_CONFIG[entity]
  if (search) {
    filtered = filtered.filter((row) => config.localSearch(row).toLowerCase().includes(search))
  }
  if (config.statusColumn && params.status && params.status !== 'all') {
    filtered = filtered.filter((row) => (row as { status: string }).status === params.status)
  }
  return filtered
}

async function fetchCompanyEntitiesPage<T>(
  table: EntityTable,
  companyId: string,
  params: EntityListPageParams,
  options?: { searchColumn?: string; statusColumn?: string },
): Promise<EntityListPageResult<T>> {
  const pageSize = Math.min(Math.max(1, params.pageSize), ENTITY_PAGE_SIZE_MAX)
  const page = Math.max(1, params.page)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase!
    .from(table)
    .select('*', { count: 'exact' })
    .eq('company_id', companyId)

  if (params.search?.trim() && options?.searchColumn) {
    query = query.ilike(options.searchColumn, `%${params.search.trim()}%`)
  }
  if (params.status && params.status !== 'all' && options?.statusColumn) {
    query = query.eq(options.statusColumn, params.status)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return {
    items: (data ?? []) as T[],
    total: count ?? 0,
    page,
    pageSize,
  }
}

function listLocalEntitiesPage<K extends PageableEntity>(
  entity: K,
  companyId: string,
  params: EntityListPageParams,
): EntityListPageResult<EntityMap[K]> {
  const pageSize = Math.min(Math.max(1, params.pageSize), ENTITY_PAGE_SIZE_MAX)
  const page = Math.max(1, params.page)
  const filtered = filterLocalPageEntities(entity, loadLocalEntities(entity, companyId), {
    ...params,
    page,
    pageSize,
  })
  const start = (page - 1) * pageSize
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  }
}

/** Server-side paginated list for customers, jobs, invoices, estimates, expenses, and materials. */
export async function listEntitiesPage<K extends PageableEntity>(
  entity: K,
  companyId: string,
  params: EntityListPageParams,
): Promise<EntityListPageResult<EntityMap[K]>> {
  const pageSize = Math.min(Math.max(1, params.pageSize), ENTITY_PAGE_SIZE_MAX)
  const page = Math.max(1, params.page)
  const normalized: EntityListPageParams = { ...params, page, pageSize }

  if (!supabase) {
    return listLocalEntitiesPage(entity, companyId, normalized)
  }

  const { searchColumn, statusColumn } = PAGE_ENTITY_CONFIG[entity]

  try {
    const result = await fetchCompanyEntitiesPage<EntityMap[K]>(
      TABLE_MAP[entity],
      companyId,
      normalized,
      { searchColumn, statusColumn },
    )
    const isUnfilteredFirstPage =
      page === 1
      && !normalized.search?.trim()
      && (!normalized.status || normalized.status === 'all')
    if (result.total === 0 && isUnfilteredFirstPage) {
      replaceCompanyInStore(KEY_MAP[entity], companyId, [])
    } else if (result.items.length > 0) {
      mergeStoreById(KEY_MAP[entity], result.items)
    }
    return result
  } catch (err) {
    warnSupabaseFallback(`listEntitiesPage(${entity})`, err)
    return listLocalEntitiesPage(entity, companyId, normalized)
  }
}

export async function saveEntity<K extends keyof EntityMap>(entity: K, item: EntityMap[K]): Promise<EntityMap[K]> {
  const key = KEY_MAP[entity]
  const existing = loadStore<EntityMap[K]>(key)
  const previous = existing.find((row) => row.id === item.id)

  upsertStore(key, item)
  if (!supabase) throw new Error('Supabase not configured')

  try {
    const table = TABLE_MAP[entity]
    const data = await upsertCompanyEntity(table, item as TableInsert<typeof table>)
    return data as EntityMap[K]
  } catch (err) {
    if (previous) {
      upsertStore(key, previous)
    } else {
      removeFromStore(key, item.id)
    }
    throw err
  }
}

export async function deleteEntity<K extends keyof EntityMap>(entity: K, id: string): Promise<void> {
  removeFromStore(KEY_MAP[entity], id)
  if (!supabase) throw new Error('Supabase not configured')
  await deleteCompanyEntity(TABLE_MAP[entity], id)
}

/** Import bundled sample records into the connected Supabase tenant (onboarding helper). */
export async function importSampleData(companyId: string): Promise<{ imported: number }> {
  if (!supabase) throw new Error('Supabase is not configured')

  const {
    DEMO_JOBS, DEMO_CUSTOMERS, DEMO_ESTIMATES, DEMO_INVOICES,
    DEMO_PROPERTIES, DEMO_EMPLOYEES, DEMO_MATERIALS, DEMO_VEHICLES, DEMO_EXPENSES, DEMO_SCHEDULE,
    DEMO_WORK_ORDERS, DEMO_SERVICES, DEMO_FUEL_LOGS,
  } = await import('@/data/mock-data')

  const sampleSeed: Partial<Record<keyof EntityMap, unknown[]>> = {
    jobs: DEMO_JOBS,
    customers: DEMO_CUSTOMERS,
    estimates: DEMO_ESTIMATES,
    invoices: DEMO_INVOICES,
    properties: DEMO_PROPERTIES,
    employees: DEMO_EMPLOYEES,
    materials: DEMO_MATERIALS,
    vehicles: DEMO_VEHICLES,
    expenses: DEMO_EXPENSES,
    schedules: DEMO_SCHEDULE,
    workOrders: DEMO_WORK_ORDERS,
    services: DEMO_SERVICES,
  }

  let imported = 0
  const entities = Object.keys(sampleSeed) as (keyof EntityMap)[]

  for (const entity of entities) {
    const seedItems = sampleSeed[entity] as EntityMap[typeof entity][]
    const items = seedItems.map((i) => ({ ...i, company_id: companyId }))
    for (const item of items) {
      await saveEntity(entity, item)
      imported++
    }
  }

  for (const log of DEMO_FUEL_LOGS) {
    await saveFuelLog(log)
  }

  return { imported }
}

/** Creates a draft job from a parsed vendor PO. */
export async function resolveCustomerForVendorPO(
  po: import('@/types/vendor-po').VendorPORecord,
  companyId: string,
): Promise<string> {
  const customers = await listSupabaseCustomers(companyId)
  const validCustomers = customers.filter((customer) => isUuid(customer.id))

  if (validCustomers.length > 0) {
    const matched = matchCustomerFromVendorPO(po, validCustomers)
    if (matched && isUuid(matched.id)) return matched.id

    const propertyMgmt = validCustomers.find((customer) => customer.type === 'property_management')
    if (propertyMgmt) return propertyMgmt.id

    return validCustomers[0].id
  }

  return createCustomerFromVendorPO(po, companyId)
}

async function listSupabaseCustomers(companyId: string): Promise<Customer[]> {
  if (!supabase) throw new Error('Supabase not configured')

  try {
    const items = await fetchCompanyEntities<Customer>('customers', companyId)
    replaceCompanyInStore(KEY_MAP.customers, companyId, items)
    return items.filter((customer) => isUuid(customer.id))
  } catch (err) {
    warnSupabaseFallback('listSupabaseCustomers', err)
  }

  return loadLocalEntities('customers', companyId).filter((customer) => isUuid(customer.id))
}

async function createCustomerFromVendorPO(
  po: import('@/types/vendor-po').VendorPORecord,
  companyId: string,
): Promise<string> {
  const customer: Customer = {
    id: crypto.randomUUID(),
    company_id: companyId,
    name: po.client_company?.trim() || po.service_location_name?.trim() || 'CD Maintenance',
    email: po.client_email?.trim() || '',
    phone: po.client_phone?.trim() || '',
    address: [po.service_address, po.service_city, po.service_state].filter(Boolean).join(', ')
      || po.client_address?.trim()
      || '',
    type: 'property_management',
    total_revenue: 0,
    job_count: 0,
    created_at: new Date().toISOString(),
  }
  try {
    const saved = await saveEntity('customers', customer)
    return saved.id
  } catch (err) {
    throw new JobCreateCustomerError(getErrorMessage(err), err)
  }
}

export async function createJobFromVendorPO(
  po: import('@/types/vendor-po').VendorPORecord,
  companyId: string
): Promise<Job> {
  const priorityText = po.priority ?? ''
  const priority = priorityText.includes('EMERGENCY') || priorityText.startsWith('P1')
    ? 'emergency' as const
    : priorityText.includes('URGENT') || priorityText.startsWith('P2')
      ? 'high' as const
      : priorityText.startsWith('P5') ? 'medium' as const : 'low' as const

  const customerId = await resolveCustomerForVendorPO(po, companyId)

  const job: Job = {
    id: crypto.randomUUID(),
    company_id: companyId,
    customer_id: customerId,
    title: `${po.order_type}: ${po.work_summary}`,
    description: po.service_description,
    status: 'draft',
    priority,
    estimated_hours: 2,
    actual_hours: 0,
    revenue: po.nte_amount,
    labor_cost: 0,
    material_cost: 0,
    fuel_cost: 0,
    overhead_cost: 0,
    profit: 0,
    profit_margin: 0,
    created_at: new Date().toISOString(),
  }
  try {
    return await saveEntity('jobs', job)
  } catch (err) {
    const customerErr = toJobCreateCustomerError(err)
    if (customerErr) throw customerErr
    throw err
  }
}

export async function createEstimateFromJob(job: Job, companyId: string): Promise<Estimate> {
  const estimate: Estimate = {
    id: crypto.randomUUID(),
    company_id: companyId,
    customer_id: job.customer_id,
    property_id: job.property_id,
    job_id: job.id,
    title: job.title,
    status: 'draft',
    labor_hours: job.estimated_hours,
    labor_rate: 75,
    material_cost: 0,
    markup_percent: 25,
    total: job.revenue,
    valid_until: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    line_items: [{
      id: crypto.randomUUID(),
      description: job.title,
      quantity: 1,
      unit_price: job.revenue,
      total: job.revenue,
      type: 'service',
    }],
    created_at: new Date().toISOString(),
  }
  return saveEntity('estimates', estimate)
}

export async function createInvoiceFromEstimate(
  estimate: Estimate,
  companyId: string,
  invoiceNumber: string
): Promise<Invoice> {
  const invoice: Invoice = {
    id: crypto.randomUUID(),
    company_id: companyId,
    customer_id: estimate.customer_id,
    job_id: estimate.job_id,
    invoice_number: invoiceNumber,
    status: 'draft',
    subtotal: estimate.total,
    tax: 0,
    total: estimate.total,
    amount_paid: 0,
    due_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    line_items: estimate.line_items,
    created_at: new Date().toISOString(),
  }
  const approvedEstimate = { ...estimate, status: 'approved' as const }
  await saveEntity('estimates', approvedEstimate)
  try {
    await saveEntity('invoices', invoice)
    return invoice
  } catch (err) {
    await saveEntity('estimates', estimate)
    throw err
  }
}

export async function createScheduleFromJob(
  job: Job,
  companyId: string,
  technicianId: string,
  startTime: string,
  endTime: string,
  location: string
): Promise<ScheduleEvent> {
  const event: ScheduleEvent = {
    id: crypto.randomUUID(),
    company_id: companyId,
    job_id: job.id,
    technician_id: technicianId,
    title: job.title,
    start_time: startTime,
    end_time: endTime,
    location,
    status: 'scheduled',
  }
  await saveEntity('schedules', event)
  await saveEntity('jobs', {
    ...job,
    status: 'scheduled',
    scheduled_date: startTime,
    assigned_technician_id: technicianId,
  })
  return event
}

type AuditLog = {
  id: string
  company_id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  created_at: string
}

export async function logAudit(companyId: string, userId: string, action: string, entityType: string, entityId: string) {
  const log: AuditLog = {
    id: crypto.randomUUID(),
    company_id: companyId,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    created_at: new Date().toISOString(),
  }
  const logs = loadStore<AuditLog>(STORE_KEYS.auditLogs)
  logs.unshift(log)
  saveStore(STORE_KEYS.auditLogs, logs.slice(0, 500))

  if (!supabase) return

  try {
    await insertRows('audit_logs', log)
  } catch (err) {
    warnSupabaseFallback('logAudit', err)
  }
}

export async function listAuditLogs(companyId: string): Promise<AuditLog[]> {
  const local = loadStore<AuditLog>(STORE_KEYS.auditLogs).filter((l) => l.company_id === companyId)
  if (!supabase) return local

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) throw error
    const items = (data ?? []) as AuditLog[]
    replaceCompanyInStore(STORE_KEYS.auditLogs, companyId, items)
    return items
  } catch (err) {
    warnSupabaseFallback('listAuditLogs', err)
    return loadStore<AuditLog>(STORE_KEYS.auditLogs).filter((l) => l.company_id === companyId)
  }
}

export async function savePayment(payment: Payment): Promise<Payment> {
  const previous = loadStore<Payment>(STORE_KEYS.payments).find((p) => p.id === payment.id)
  upsertStore(STORE_KEYS.payments, payment)
  if (!supabase) throw new Error('Supabase not configured')

  try {
    const { data, error } = await upsertRows('payments', payment)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Payment
  } catch (err) {
    if (previous) upsertStore(STORE_KEYS.payments, previous)
    else removeFromStore(STORE_KEYS.payments, payment.id)
    throw err
  }
}

export async function listPayments(companyId: string): Promise<Payment[]> {
  const invoices = await listEntities('invoices', companyId)
  const invoiceIds = invoices.map((i) => i.id)
  const filterByCompanyInvoices = (payments: Payment[]) =>
    payments.filter((p) => invoiceIds.includes(p.invoice_id))

  if (!supabase) return filterByCompanyInvoices(loadStore<Payment>(STORE_KEYS.payments))

  if (invoiceIds.length === 0) return []

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .in('invoice_id', invoiceIds)
      .order('created_at', { ascending: false })

    if (error) throw error

    const items = (data ?? []) as Payment[]
    replaceScopedInStore(STORE_KEYS.payments, (p) => invoiceIds.includes(p.invoice_id), items)
    return items
  } catch (err) {
    warnSupabaseFallback('listPayments', err)
    return filterByCompanyInvoices(loadStore<Payment>(STORE_KEYS.payments))
  }
}

export async function saveFuelLog(log: FuelLog): Promise<FuelLog> {
  const previous = loadStore<FuelLog>(STORE_KEYS.fuelLogs).find((f) => f.id === log.id)
  upsertStore(STORE_KEYS.fuelLogs, log)
  if (!supabase) throw new Error('Supabase not configured')

  try {
    const { data, error } = await upsertRows('fuel_logs', log)
      .select()
      .single()

    if (error) throw error
    return data as unknown as FuelLog
  } catch (err) {
    if (previous) upsertStore(STORE_KEYS.fuelLogs, previous)
    else removeFromStore(STORE_KEYS.fuelLogs, log.id)
    throw err
  }
}

export async function listFuelLogs(companyId: string): Promise<FuelLog[]> {
  const vehicles = await listEntities('vehicles', companyId)
  const vehicleIds = vehicles.map((v) => v.id)
  const filterByVehicles = (logs: FuelLog[]) => logs.filter((f) => vehicleIds.includes(f.vehicle_id))

  if (!supabase) return filterByVehicles(loadStore<FuelLog>(STORE_KEYS.fuelLogs))

  if (vehicleIds.length === 0) return []

  try {
    const { data, error } = await supabase
      .from('fuel_logs')
      .select('*')
      .in('vehicle_id', vehicleIds)
      .order('date', { ascending: false })

    if (error) throw error

    const items = (data ?? []) as FuelLog[]
    replaceScopedInStore(STORE_KEYS.fuelLogs, (f) => vehicleIds.includes(f.vehicle_id), items)
    return items
  } catch (err) {
    warnSupabaseFallback('listFuelLogs', err)
    return filterByVehicles(loadStore<FuelLog>(STORE_KEYS.fuelLogs))
  }
}

function listLocalFuelLogsPage(vehicleIds: string[], params: EntityListPageParams): EntityListPageResult<FuelLog> {
  const pageSize = Math.min(Math.max(1, params.pageSize), ENTITY_PAGE_SIZE_MAX)
  const page = Math.max(1, params.page)
  const filtered = loadStore<FuelLog>(STORE_KEYS.fuelLogs).filter((f) => vehicleIds.includes(f.vehicle_id))
  const start = (page - 1) * pageSize
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  }
}

/** Server-side paginated fuel log list scoped to company vehicles. */
export async function listFuelLogsPage(
  companyId: string,
  params: EntityListPageParams,
): Promise<EntityListPageResult<FuelLog>> {
  const pageSize = Math.min(Math.max(1, params.pageSize), ENTITY_PAGE_SIZE_MAX)
  const page = Math.max(1, params.page)
  const normalized: EntityListPageParams = { ...params, page, pageSize }

  const vehicles = await listEntities('vehicles', companyId)
  const vehicleIds = vehicles.map((v) => v.id)

  if (vehicleIds.length === 0) {
    return { items: [], total: 0, page, pageSize }
  }

  if (!supabase) {
    return listLocalFuelLogsPage(vehicleIds, normalized)
  }

  try {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('fuel_logs')
      .select('*', { count: 'exact' })
      .in('vehicle_id', vehicleIds)
      .order('date', { ascending: false })
      .range(from, to)

    if (error) throw error

    const items = (data ?? []) as FuelLog[]
    const isUnfilteredFirstPage = page === 1 && !normalized.search?.trim()
    if ((count ?? 0) === 0 && isUnfilteredFirstPage) {
      replaceScopedInStore<FuelLog>(STORE_KEYS.fuelLogs, (f) => vehicleIds.includes(f.vehicle_id), [])
    } else if (items.length > 0) {
      mergeStoreById(STORE_KEYS.fuelLogs, items)
    }

    return { items, total: count ?? 0, page, pageSize }
  } catch (err) {
    warnSupabaseFallback('listFuelLogsPage', err)
    return listLocalFuelLogsPage(vehicleIds, normalized)
  }
}

export interface FuelLogsSummary {
  totalCost: number
  totalMiles: number
}

export interface ExpensesSummary {
  totalAmount: number
  count: number
}

function sumFuelLogTotals(logs: Pick<FuelLog, 'total_cost' | 'miles'>[]): FuelLogsSummary {
  return logs.reduce(
    (acc, log) => ({
      totalCost: acc.totalCost + log.total_cost,
      totalMiles: acc.totalMiles + log.miles,
    }),
    { totalCost: 0, totalMiles: 0 },
  )
}

/** Lightweight fuel KPI totals (table uses listFuelLogsPage). */
export async function getFuelLogsSummary(companyId: string): Promise<FuelLogsSummary> {
  const vehicles = await listEntities('vehicles', companyId)
  const vehicleIds = vehicles.map((v) => v.id)
  if (vehicleIds.length === 0) return { totalCost: 0, totalMiles: 0 }

  const local = loadStore<FuelLog>(STORE_KEYS.fuelLogs).filter((f) => vehicleIds.includes(f.vehicle_id))
  if (!supabase) return sumFuelLogTotals(local)

  try {
    const { data, error } = await supabase
      .from('fuel_logs')
      .select('total_cost, miles')
      .in('vehicle_id', vehicleIds)

    if (error) throw error
    return sumFuelLogTotals((data ?? []) as Pick<FuelLog, 'total_cost' | 'miles'>[])
  } catch (err) {
    warnSupabaseFallback('getFuelLogsSummary', err)
    return sumFuelLogTotals(local)
  }
}

/** Lightweight expense KPI total (table uses listEntitiesPage). */
export async function getExpensesSummary(companyId: string): Promise<ExpensesSummary> {
  const local = loadLocalEntities('expenses', companyId)
  const sumLocal = (rows: Expense[]) => ({
    totalAmount: rows.reduce((sum, row) => sum + row.amount, 0),
    count: rows.length,
  })

  if (!supabase) return sumLocal(local)

  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('company_id', companyId)

    if (error) throw error
    const amounts = (data ?? []) as Pick<Expense, 'amount'>[]
    return {
      totalAmount: amounts.reduce((sum, row) => sum + row.amount, 0),
      count: amounts.length,
    }
  } catch (err) {
    warnSupabaseFallback('getExpensesSummary', err)
    return sumLocal(local)
  }
}

export interface InvoicesSummary {
  outstanding: number
  paidThisMonth: number
}

type InvoiceKpiRow = Pick<Invoice, 'status' | 'total' | 'amount_paid' | 'paid_date'>

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

function sumInvoiceKpis(rows: InvoiceKpiRow[]): InvoicesSummary {
  return rows.reduce(
    (acc, invoice) => {
      if (invoice.status !== 'paid') {
        acc.outstanding += invoice.total - invoice.amount_paid
      }
      if (invoice.status === 'paid' && invoice.paid_date && isThisMonth(invoice.paid_date)) {
        acc.paidThisMonth += invoice.amount_paid
      }
      return acc
    },
    { outstanding: 0, paidThisMonth: 0 },
  )
}

/** Lightweight invoice KPI totals (table uses listEntitiesPage). */
export async function getInvoicesSummary(companyId: string): Promise<InvoicesSummary> {
  const local = loadLocalEntities('invoices', companyId) as Invoice[]
  const sumLocal = () =>
    sumInvoiceKpis(
      local.map((invoice) => ({
        status: invoice.status,
        total: invoice.total,
        amount_paid: invoice.amount_paid,
        paid_date: invoice.paid_date,
      })),
    )

  if (!supabase) return sumLocal()

  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('status, total, amount_paid, paid_date')
      .eq('company_id', companyId)

    if (error) throw error
    return sumInvoiceKpis((data ?? []) as InvoiceKpiRow[])
  } catch (err) {
    warnSupabaseFallback('getInvoicesSummary', err)
    return sumLocal()
  }
}

/** Invoice numbers only — for sequence generation without full list fetch. */
export async function listInvoiceNumbers(companyId: string): Promise<Pick<Invoice, 'invoice_number'>[]> {
  const local = (loadLocalEntities('invoices', companyId) as Invoice[]).map((invoice) => ({
    invoice_number: invoice.invoice_number,
  }))

  if (!supabase) return local

  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('company_id', companyId)

    if (error) throw error
    return (data ?? []) as Pick<Invoice, 'invoice_number'>[]
  } catch (err) {
    warnSupabaseFallback('listInvoiceNumbers', err)
    return local
  }
}

/** Fetch a single invoice (e.g. Stripe return URL) without loading the full list. */
export async function fetchInvoiceById(companyId: string, invoiceId: string): Promise<Invoice | null> {
  const local = loadLocalEntities('invoices', companyId) as Invoice[]
  const cached = local.find((invoice) => invoice.id === invoiceId) ?? null
  if (!supabase) return cached

  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', invoiceId)
      .maybeSingle()

    if (error) throw error
    if (!data) return cached
    const invoice = data as Invoice
    mergeStoreById(STORE_KEYS.invoices, [invoice])
    return invoice
  } catch (err) {
    warnSupabaseFallback('fetchInvoiceById', err)
    return cached
  }
}

export interface MaterialsSummary {
  lowStock: Pick<Material, 'id' | 'name' | 'quantity' | 'reorder_level'>[]
  names: Record<string, string>
}

/** Lightweight materials KPI (table uses listEntitiesPage). */
export async function getMaterialsSummary(companyId: string): Promise<MaterialsSummary> {
  const local = loadLocalEntities('materials', companyId) as Material[]
  const sumLocal = () => {
    const names: Record<string, string> = {}
    const lowStock: MaterialsSummary['lowStock'] = []
    for (const material of local) {
      names[material.id] = material.name
      if (material.quantity <= material.reorder_level) {
        lowStock.push({
          id: material.id,
          name: material.name,
          quantity: material.quantity,
          reorder_level: material.reorder_level,
        })
      }
    }
    return { lowStock, names }
  }

  if (!supabase) return sumLocal()

  try {
    const { data, error } = await supabase
      .from('materials')
      .select('id, name, quantity, reorder_level')
      .eq('company_id', companyId)

    if (error) throw error
    const rows = (data ?? []) as Pick<Material, 'id' | 'name' | 'quantity' | 'reorder_level'>[]
    const names: Record<string, string> = {}
    const lowStock: MaterialsSummary['lowStock'] = []
    for (const material of rows) {
      names[material.id] = material.name
      if (material.quantity <= material.reorder_level) {
        lowStock.push(material)
      }
    }
    return { lowStock, names }
  } catch (err) {
    warnSupabaseFallback('getMaterialsSummary', err)
    return sumLocal()
  }
}

export type CustomerContact = Pick<Customer, 'id' | 'name' | 'email' | 'phone' | 'notification_preferences'>

/** Customer picker + notify fields without full CRM rows. */
export async function listCustomerContacts(companyId: string): Promise<CustomerContact[]> {
  const local = (loadLocalEntities('customers', companyId) as Customer[]).map((customer) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    notification_preferences: customer.notification_preferences,
  }))

  if (!supabase) return local

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, email, phone, notification_preferences')
      .eq('company_id', companyId)
      .order('name', { ascending: true })

    if (error) throw error
    return ((data ?? []) as Customer[]).map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      notification_preferences: customer.notification_preferences,
    }))
  } catch (err) {
    warnSupabaseFallback('listCustomerContacts', err)
    return local
  }
}

export interface SmartEngineJobContext {
  totalJobs: number
  drywallStats: Pick<Job, 'estimated_hours' | 'actual_hours' | 'revenue' | 'profit_margin'>[]
}

function buildSmartEngineJobContext(jobs: Pick<Job, 'title' | 'estimated_hours' | 'actual_hours' | 'revenue' | 'profit_margin'>[]): SmartEngineJobContext {
  const drywallStats = jobs
    .filter((job) => job.title.toLowerCase().includes('drywall'))
    .map((job) => ({
      estimated_hours: job.estimated_hours,
      actual_hours: job.actual_hours,
      revenue: job.revenue,
      profit_margin: job.profit_margin,
    }))
  return { totalJobs: jobs.length, drywallStats }
}

/** Smart estimate engine context without loading full job records. */
export async function getSmartEngineJobContext(companyId: string): Promise<SmartEngineJobContext> {
  const local = loadLocalEntities('jobs', companyId) as Job[]
  const sumLocal = () =>
    buildSmartEngineJobContext(
      local.map((job) => ({
        title: job.title,
        estimated_hours: job.estimated_hours,
        actual_hours: job.actual_hours,
        revenue: job.revenue,
        profit_margin: job.profit_margin,
      })),
    )

  if (!supabase) return sumLocal()

  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('title, estimated_hours, actual_hours, revenue, profit_margin')
      .eq('company_id', companyId)

    if (error) throw error
    return buildSmartEngineJobContext(
      (data ?? []) as Pick<Job, 'title' | 'estimated_hours' | 'actual_hours' | 'revenue' | 'profit_margin'>[],
    )
  } catch (err) {
    warnSupabaseFallback('getSmartEngineJobContext', err)
    return sumLocal()
  }
}

export async function saveTimeEntry(entry: TimeEntry): Promise<TimeEntry> {
  const previous = loadStore<TimeEntry>(STORE_KEYS.timeEntries).find((e) => e.id === entry.id)
  upsertStore(STORE_KEYS.timeEntries, entry)
  if (!supabase) throw new Error('Supabase not configured')

  try {
    const { data, error } = await upsertRows('time_entries', entry)
      .select()
      .single()

    if (error) throw error
    return data as unknown as TimeEntry
  } catch (err) {
    if (previous) upsertStore(STORE_KEYS.timeEntries, previous)
    else removeFromStore(STORE_KEYS.timeEntries, entry.id)
    throw err
  }
}

export async function listTimeEntries(companyId: string): Promise<TimeEntry[]> {
  const local = loadStore<TimeEntry>(STORE_KEYS.timeEntries).filter((e) => e.company_id === companyId)

  if (!supabase) return local

  try {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('company_id', companyId)
      .order('start_time', { ascending: false })

    if (error) throw error
    const items = (data ?? []) as TimeEntry[]
    replaceCompanyInStore(STORE_KEYS.timeEntries, companyId, items)
    return items
  } catch (err) {
    warnSupabaseFallback('listTimeEntries', err)
    return local
  }
}

export async function saveWorkOrderFromAI(
  companyId: string,
  source: WorkOrder['source'],
  rawContent: string,
  aiData: import('@/types').AIExtractedData
): Promise<WorkOrder> {
  const wo: WorkOrder = {
    id: crypto.randomUUID(),
    company_id: companyId,
    source,
    status: 'review',
    raw_content: rawContent,
    ai_extracted_data: aiData,
    created_at: new Date().toISOString(),
  }
  return saveEntity('workOrders', wo)
}
