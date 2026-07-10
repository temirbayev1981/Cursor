import type { Job, Customer, Estimate, Invoice, Property, Employee, Material, Vehicle, Expense, ScheduleEvent, WorkOrder, ServiceCatalogItem, FuelLog } from '@/types'
import { loadStore, saveStore, upsertStore, removeFromStore, filterByCompany, STORE_KEYS } from '@/lib/data-store'
import {
  DEMO_JOBS, DEMO_CUSTOMERS, DEMO_ESTIMATES, DEMO_INVOICES,
  DEMO_PROPERTIES, DEMO_EMPLOYEES, DEMO_MATERIALS, DEMO_VEHICLES, DEMO_EXPENSES, DEMO_SCHEDULE,
  DEMO_WORK_ORDERS, DEMO_SERVICES, DEMO_FUEL_LOGS,
} from '@/data/mock-data'
import { supabase, DEMO_MODE } from '@/lib/supabase'

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

const TABLE_MAP: Record<keyof EntityMap, string> = {
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

type SupabaseOps = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        order: (col: string, opts: { ascending: boolean }) => Promise<{ data: unknown[] | null; error: { message: string } | null }>
      }
    }
    upsert: (row: unknown) => {
      select: () => {
        single: () => Promise<{ data: unknown; error: { message: string } | null }>
      }
    }
    delete: () => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>
    }
  }
}

function getDb() {
  return supabase as unknown as SupabaseOps
}

function ensureSeeded<K extends keyof EntityMap>(entity: K, companyId: string): EntityMap[K][] {
  const key = KEY_MAP[entity]
  const seeded = localStorage.getItem(`${key}_seeded`)
  let items = loadStore<EntityMap[K]>(key)
  if (!seeded && items.length === 0 && SEED[entity]) {
    items = (SEED[entity] as EntityMap[K][]).map((i) => ({ ...i, company_id: companyId }))
    saveStore(key, items)
    localStorage.setItem(`${key}_seeded`, 'true')
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
    const { data, error } = await getDb()
      .from(TABLE_MAP[entity])
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const items = (data ?? []) as EntityMap[K][]
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

  const { data, error } = await getDb()
    .from(TABLE_MAP[entity])
    .upsert(item)
    .select()
    .single()

  if (error) throw error
  return data as EntityMap[K]
}

export async function deleteEntity<K extends keyof EntityMap>(entity: K, id: string): Promise<void> {
  removeFromStore(KEY_MAP[entity], id)

  if (DEMO_MODE || !supabase) {
    return
  }

  const { error } = await getDb().from(TABLE_MAP[entity]).delete().eq('id', id)
  if (error) throw error
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

  saveStore(STORE_KEYS.fuelLogs, DEMO_FUEL_LOGS)
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

  const job: Job = {
    id: crypto.randomUUID(),
    company_id: companyId,
    customer_id: 'cust-001',
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

export async function logAudit(companyId: string, userId: string, action: string, entityType: string, entityId: string) {
  const log = {
    id: crypto.randomUUID(),
    company_id: companyId,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    created_at: new Date().toISOString(),
  }
  const logs = loadStore<typeof log>(STORE_KEYS.auditLogs)
  logs.unshift(log)
  saveStore(STORE_KEYS.auditLogs, logs.slice(0, 500))
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

export async function listFuelLogs(companyId: string): Promise<FuelLog[]> {
  const vehicles = await listEntities('vehicles', companyId)
  const vehicleIds = new Set(vehicles.map((v) => v.id))
  return ensureFuelLogsSeeded().filter((f) => vehicleIds.has(f.vehicle_id))
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
