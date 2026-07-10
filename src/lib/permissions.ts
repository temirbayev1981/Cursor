import type { UserRole } from '@/types'

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: ['*'],
  admin: ['dashboard', 'jobs', 'work-orders', 'estimates', 'customers', 'properties', 'scheduling', 'technicians', 'materials', 'vehicles', 'expenses', 'invoices', 'reports', 'ai-assistant', 'settings', 'dispatch'],
  dispatcher: ['dashboard', 'jobs', 'work-orders', 'estimates', 'customers', 'properties', 'scheduling', 'dispatch', 'ai-assistant'],
  technician: ['jobs', 'scheduling', 'tech'],
  accountant: ['dashboard', 'invoices', 'expenses', 'reports', 'customers'],
  customer: ['portal-customer'],
}

export function canAccess(role: UserRole, module: string): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? []
  return perms.includes('*') || perms.includes(module)
}

export function getDefaultRoute(role: UserRole): string {
  if (role === 'technician') return '/tech'
  if (role === 'customer') return '/portal/customer'
  return '/dashboard'
}
