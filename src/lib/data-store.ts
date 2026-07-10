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
  workflows: 'handymanos_workflows',
  auditLogs: 'handymanos_audit_logs',
  timeEntries: 'handymanos_time_entries',
} as const
