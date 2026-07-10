import type { UserRole, Profile } from '@/types'
import { isTechOnboardingPending } from '@/services/tech-onboarding-service'

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
  if (role === 'technician') {
    return isTechOnboardingPending() ? '/tech-onboarding' : '/tech'
  }
  if (role === 'customer') return '/portal/customer'
  return '/dashboard'
}

/** Invited team members join an existing company and skip owner onboarding. */
export function shouldSkipOnboardingForRole(role: UserRole): boolean {
  return role !== 'owner'
}

export interface PostAuthState {
  role: UserRole
  onboardingComplete: boolean
  profile?: Pick<Profile, 'id' | 'email'>
}

export function resolvePostAuthRoute({ role, onboardingComplete }: PostAuthState): string {
  if (!onboardingComplete && !shouldSkipOnboardingForRole(role)) return '/onboarding'
  return getDefaultRoute(role)
}
