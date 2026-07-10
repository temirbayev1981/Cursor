import type { Job, Customer, Estimate, Invoice, Property, Employee, Material, Vehicle, Expense, ScheduleEvent } from '@/types'
import { loadStore, saveStore, upsertStore, removeFromStore, filterByCompany, STORE_KEYS } from '@/lib/data-store'
import {
  DEMO_JOBS, DEMO_CUSTOMERS, DEMO_ESTIMATES, DEMO_INVOICES,
  DEMO_PROPERTIES, DEMO_EMPLOYEES, DEMO_MATERIALS, DEMO_VEHICLES, DEMO_EXPENSES, DEMO_SCHEDULE,
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

export async function listEntities<K extends keyof EntityMap>(entity: K, companyId: string): Promise<EntityMap[K][]> {
  if (DEMO_MODE || !supabase) {
    return ensureSeeded(entity, companyId)
  }
  const client = supabase as unknown as {
    from: (t: string) => { select: (s: string) => { eq: (c: string, v: string) => { order: (c: string, o: object) => Promise<{ data: EntityMap[K][] | null; error: { message: string } | null }> } } }
  }
  const { data, error } = await client.from(TABLE_MAP[entity]).select('*').eq('company_id', companyId).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function saveEntity<K extends keyof EntityMap>(entity: K, item: EntityMap[K]): Promise<EntityMap[K]> {
  if (DEMO_MODE || !supabase) {
    return upsertStore(KEY_MAP[entity], item)
  }
  const client = supabase as unknown as {
    from: (t: string) => { upsert: (d: unknown) => { select: () => { single: () => Promise<{ data: EntityMap[K]; error: { message: string } | null }> } } }
  }
  const { data, error } = await client.from(TABLE_MAP[entity]).upsert(item).select().single()
  if (error) throw error
  return data
}

export async function deleteEntity<K extends keyof EntityMap>(entity: K, id: string): Promise<void> {
  if (DEMO_MODE || !supabase) {
    removeFromStore(KEY_MAP[entity], id)
    return
  }
  const client = supabase as unknown as {
    from: (t: string) => { delete: () => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> } }
  }
  const { error } = await client.from(TABLE_MAP[entity]).delete().eq('id', id)
  if (error) throw error
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
