import type { Job, Customer, Estimate, Invoice, Property, Employee, Material, Vehicle, Expense, ScheduleEvent, WorkOrder, ServiceCatalogItem, FuelLog, Payment, TimeEntry } from '@/types'
import { loadStore, saveStore, upsertStore, removeFromStore, filterByCompany, STORE_KEYS } from '@/lib/data-store'
import {
  DEMO_JOBS, DEMO_CUSTOMERS, DEMO_ESTIMATES, DEMO_INVOICES,
  DEMO_PROPERTIES, DEMO_EMPLOYEES, DEMO_MATERIALS, DEMO_VEHICLES, DEMO_EXPENSES, DEMO_SCHEDULE,
  DEMO_WORK_ORDERS, DEMO_SERVICES, DEMO_FUEL_LOGS,
  DEMO_JOBS_B, DEMO_CUSTOMERS_B, DEMO_EMPLOYEES_B, DEMO_MATERIALS_B,
} from '@/data/mock-data'
import { matchCustomerFromVendorPO } from '@/lib/vendor-po-customer-match'
import { supabase, DEMO_MODE } from '@/lib/supabase'

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

const SEED: Partial<Record<keyof EntityMap, unknown[]>> = {
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

const SEED_B: Partial<Record<keyof EntityMap, unknown[]>> = {
  jobs: DEMO_JOBS_B,
  customers: DEMO_CUSTOMERS_B,
  employees: DEMO_EMPLOYEES_B,
  materials: DEMO_MATERIALS_B,
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

async function fetchCompanyEntities<T>(table: EntityTable, companyId: string): Promise<T[]> {
  const { data, error } = await supabase!
    .from(table)
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as T[]
}

async function upsertCompanyEntity<T>(table: EntityTable, item: T): Promise<T> {
  const { data, error } = await supabase!
    .from(table)
    .upsert(item as never)
    .select()
    .single()

  if (error) throw error
  return data as T
}

async function deleteCompanyEntity(table: EntityTable, id: string): Promise<void> {
  const { error } = await supabase!.from(table).delete().eq('id', id)
  if (error) throw error
}

function ensureSeeded<K extends keyof EntityMap>(entity: K, companyId: string): EntityMap[K][] {
  const key = KEY_MAP[entity]
  const seededKey = `${key}_seeded_${companyId}`
  let items = loadStore<EntityMap[K]>(key)
  const companyItems = filterByCompany(items, companyId)

  if (!localStorage.getItem(seededKey) && companyItems.length === 0) {
    const seedSource = companyId === 'comp-002'
      ? SEED_B[entity]
      : companyId === 'comp-001'
        ? SEED[entity]
        : undefined

    if (seedSource) {
      const seededItems = (seedSource as EntityMap[K][]).map((item) => ({
        ...item,
        company_id: companyId,
      }))
      items = [...items, ...seededItems]
      saveStore(key, items)
    }

    localStorage.setItem(seededKey, 'true')
  }

  return filterByCompany(items, companyId)
}

function loadLocalEntities<K extends keyof EntityMap>(entity: K, companyId: string): EntityMap[K][] {
  return filterByCompany(loadStore<EntityMap[K]>(KEY_MAP[entity]), companyId)
}

export async function listEntities<K extends keyof EntityMap>(entity: K, companyId: string): Promise<EntityMap[K][]> {
  if (DEMO_MODE || !supabase) {
    return ensureSeeded(entity, companyId)
  }

  try {
    const items = await fetchCompanyEntities<EntityMap[K]>(TABLE_MAP[entity], companyId)
    if (items.length > 0) {
      saveStore(KEY_MAP[entity], items)
      return items
    }

    return loadLocalEntities(entity, companyId)
  } catch {
    const local = loadLocalEntities(entity, companyId)
    return local.length > 0 ? local : ensureSeeded(entity, companyId)
  }
}

export async function saveEntity<K extends keyof EntityMap>(entity: K, item: EntityMap[K]): Promise<EntityMap[K]> {
  upsertStore(KEY_MAP[entity], item)

  if (DEMO_MODE || !supabase) {
    return item
  }

  const data = await upsertCompanyEntity<EntityMap[K]>(TABLE_MAP[entity], item)
  return data
}

export async function deleteEntity<K extends keyof EntityMap>(entity: K, id: string): Promise<void> {
  removeFromStore(KEY_MAP[entity], id)

  if (DEMO_MODE || !supabase) {
    return
  }

  await deleteCompanyEntity(TABLE_MAP[entity], id)
}

export async function importDemoSeedToSupabase(companyId: string): Promise<{ imported: number }> {
  if (!supabase) {
    throw new Error('Supabase is not configured')
  }

  let imported = 0
  const entities = Object.keys(SEED) as (keyof EntityMap)[]

  for (const entity of entities) {
    const seedItems = SEED[entity] as EntityMap[typeof entity][]
    const items = seedItems.map((i) => ({ ...i, company_id: companyId }))
    for (const item of items) {
      await saveEntity(entity, item)
      imported++
    }
  }

  for (const log of DEMO_FUEL_LOGS) {
    await saveFuelLog(log)
  }
  localStorage.setItem(`${STORE_KEYS.fuelLogs}_seeded`, 'true')

  return { imported }
}

export async function createJobFromVendorPO(
  po: import('@/types/vendor-po').VendorPORecord,
  companyId: string
): Promise<Job> {
  const priority = po.priority.includes('EMERGENCY') || po.priority.startsWith('P1')
    ? 'emergency' as const
    : po.priority.includes('URGENT') || po.priority.startsWith('P2')
      ? 'high' as const
      : po.priority.startsWith('P5') ? 'medium' as const : 'low' as const

  const customers = await listEntities('customers', companyId)
  const matched = matchCustomerFromVendorPO(po, customers)
  const customerId = matched?.id
    ?? customers.find((c) => c.type === 'property_management')?.id
    ?? customers[0]?.id
    ?? 'cust-001'

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
  return saveEntity('jobs', job)
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
    valid_until: new Date(Date.now() + 14 * 86400000).toISOString(),
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
  await saveEntity('invoices', invoice)
  await saveEntity('estimates', { ...estimate, status: 'approved' })
  return invoice
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

  if (DEMO_MODE || !supabase) return

  try {
    await supabase.from('audit_logs').insert(log as never)
  } catch {
    // local cache remains authoritative offline
  }
}

export async function listAuditLogs(companyId: string): Promise<AuditLog[]> {
  if (DEMO_MODE || !supabase) {
    return loadStore<AuditLog>(STORE_KEYS.auditLogs).filter((l) => l.company_id === companyId)
  }

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) throw error
    const items = (data ?? []) as AuditLog[]
    if (items.length > 0) {
      saveStore(STORE_KEYS.auditLogs, items)
      return items
    }
    return loadStore<AuditLog>(STORE_KEYS.auditLogs).filter((l) => l.company_id === companyId)
  } catch {
    return loadStore<AuditLog>(STORE_KEYS.auditLogs).filter((l) => l.company_id === companyId)
  }
}

export async function savePayment(payment: Payment): Promise<Payment> {
  upsertStore(STORE_KEYS.payments, payment)

  if (DEMO_MODE || !supabase) return payment

  const { data, error } = await supabase
    .from('payments')
    .upsert(payment as never)
    .select()
    .single()

  if (error) throw error
  return data as unknown as Payment
}

export async function listPayments(companyId: string): Promise<Payment[]> {
  const invoices = await listEntities('invoices', companyId)
  const invoiceIds = invoices.map((i) => i.id)
  const filterByCompanyInvoices = (payments: Payment[]) =>
    payments.filter((p) => invoiceIds.includes(p.invoice_id))

  if (DEMO_MODE || !supabase) {
    return filterByCompanyInvoices(loadStore<Payment>(STORE_KEYS.payments))
  }

  if (invoiceIds.length === 0) return []

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .in('invoice_id', invoiceIds)
      .order('created_at', { ascending: false })

    if (error) throw error

    const items = (data ?? []) as Payment[]
    if (items.length > 0) {
      saveStore(STORE_KEYS.payments, items)
      return items
    }

    return filterByCompanyInvoices(loadStore<Payment>(STORE_KEYS.payments))
  } catch {
    return filterByCompanyInvoices(loadStore<Payment>(STORE_KEYS.payments))
  }
}

function ensureFuelLogsSeeded(): FuelLog[] {
  const seeded = localStorage.getItem(`${STORE_KEYS.fuelLogs}_seeded`)
  let items = loadStore<FuelLog>(STORE_KEYS.fuelLogs)
  if (!seeded && items.length === 0) {
    items = DEMO_FUEL_LOGS
    saveStore(STORE_KEYS.fuelLogs, items)
    localStorage.setItem(`${STORE_KEYS.fuelLogs}_seeded`, 'true')
  }
  return items
}

export async function saveFuelLog(log: FuelLog): Promise<FuelLog> {
  upsertStore(STORE_KEYS.fuelLogs, log)

  if (DEMO_MODE || !supabase) return log

  const { data, error } = await supabase
    .from('fuel_logs')
    .upsert(log as never)
    .select()
    .single()

  if (error) throw error
  return data as unknown as FuelLog
}

export async function listFuelLogs(companyId: string): Promise<FuelLog[]> {
  const vehicles = await listEntities('vehicles', companyId)
  const vehicleIds = vehicles.map((v) => v.id)
  const filterByVehicles = (logs: FuelLog[]) => logs.filter((f) => vehicleIds.includes(f.vehicle_id))

  if (DEMO_MODE || !supabase) {
    return filterByVehicles(ensureFuelLogsSeeded())
  }

  if (vehicleIds.length === 0) return []

  try {
    const { data, error } = await supabase
      .from('fuel_logs')
      .select('*')
      .in('vehicle_id', vehicleIds)
      .order('date', { ascending: false })

    if (error) throw error

    const items = (data ?? []) as FuelLog[]
    if (items.length > 0) {
      saveStore(STORE_KEYS.fuelLogs, items)
      return items
    }

    return filterByVehicles(ensureFuelLogsSeeded())
  } catch {
    return filterByVehicles(ensureFuelLogsSeeded())
  }
}

export async function saveTimeEntry(entry: TimeEntry): Promise<TimeEntry> {
  upsertStore(STORE_KEYS.timeEntries, entry)

  if (DEMO_MODE || !supabase) return entry

  const { data, error } = await supabase
    .from('time_entries')
    .upsert(entry as never)
    .select()
    .single()

  if (error) throw error
  return data as unknown as TimeEntry
}

export async function listTimeEntries(companyId: string): Promise<TimeEntry[]> {
  const local = loadStore<TimeEntry>(STORE_KEYS.timeEntries).filter((e) => e.company_id === companyId)

  if (DEMO_MODE || !supabase) return local

  try {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('company_id', companyId)
      .order('start_time', { ascending: false })

    if (error) throw error
    const items = (data ?? []) as TimeEntry[]
    if (items.length > 0) {
      saveStore(STORE_KEYS.timeEntries, items)
      return items
    }
    return local
  } catch {
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
