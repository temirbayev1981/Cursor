export function loadStore<T>(key: string, fallback: T[] = []): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : fallback
  } catch {
    return fallback
  }
}

export function saveStore<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export function upsertStore<T extends { id: string }>(key: string, item: T): T {
  const items = loadStore<T>(key)
  const idx = items.findIndex((i) => i.id === item.id)
  if (idx >= 0) {
    items[idx] = item
  } else {
    items.unshift(item)
  }
  saveStore(key, items)
  return item
}

export function removeFromStore<T extends { id: string }>(key: string, id: string): void {
  saveStore(key, loadStore<T>(key).filter((i) => i.id !== id))
}

/** Merge remote rows into local cache by id (preserves other tenants' cached rows). */
export function mergeStoreById<T extends { id: string }>(key: string, incoming: T[]): T[] {
  const byId = new Map(loadStore<T>(key).map((item) => [item.id, item]))
  for (const item of incoming) {
    byId.set(item.id, item)
  }
  const merged = Array.from(byId.values())
  saveStore(key, merged)
  return merged
}

/** Replace cached rows for one company with authoritative server data (including empty). */
export function replaceCompanyInStore<T extends { id: string; company_id: string }>(
  key: string,
  companyId: string,
  incoming: T[],
): T[] {
  const others = loadStore<T>(key).filter((item) => item.company_id !== companyId)
  const next = [...others, ...incoming]
  saveStore(key, next)
  return incoming
}

/** Replace cached rows matching a predicate with authoritative server data (including empty). */
export function replaceScopedInStore<T extends { id: string }>(
  key: string,
  inScope: (item: T) => boolean,
  incoming: T[],
): T[] {
  const others = loadStore<T>(key).filter((item) => !inScope(item))
  const next = [...others, ...incoming]
  saveStore(key, next)
  return incoming
}

export function filterByCompany<T extends { company_id: string }>(items: T[], companyId: string): T[] {
  return items.filter((i) => i.company_id === companyId)
}

export const STORE_KEYS = {
  jobs: 'handymanos_jobs',
  customers: 'handymanos_customers',
  estimates: 'handymanos_estimates',
  invoices: 'handymanos_invoices',
  properties: 'handymanos_properties',
  employees: 'handymanos_employees',
  materials: 'handymanos_materials',
  vehicles: 'handymanos_vehicles',
  expenses: 'handymanos_expenses',
  schedules: 'handymanos_schedules',
  workOrders: 'handymanos_work_orders',
  fuelLogs: 'handymanos_fuel_logs',
  services: 'handymanos_services',
  photos: 'handymanos_photos',
  inventory: 'handymanos_inventory',
  payments: 'handymanos_payments',
  workflows: 'handymanos_workflows',
  auditLogs: 'handymanos_audit_logs',
  timeEntries: 'handymanos_time_entries',
} as const
