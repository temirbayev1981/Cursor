import type { Customer } from '@/types'

export interface CustomerNotificationPreferences {
  email: boolean
  sms: boolean
}

const PREFS_KEY_PREFIX = 'handymanos_customer_notify_prefs_'

const DEFAULT_PREFS: CustomerNotificationPreferences = {
  email: true,
  sms: false,
}

function parsePrefs(raw: unknown): CustomerNotificationPreferences | null {
  if (!raw || typeof raw !== 'object') return null
  const parsed = raw as Partial<CustomerNotificationPreferences>
  return {
    email: parsed.email ?? true,
    sms: parsed.sms ?? false,
  }
}

export function getCustomerNotificationPreferences(customerId: string): CustomerNotificationPreferences {
  if (typeof localStorage === 'undefined') return DEFAULT_PREFS
  try {
    const raw = localStorage.getItem(`${PREFS_KEY_PREFIX}${customerId}`)
    if (!raw) return DEFAULT_PREFS
    return parsePrefs(JSON.parse(raw)) ?? DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

export function saveCustomerNotificationPreferences(
  customerId: string,
  prefs: CustomerNotificationPreferences,
): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(`${PREFS_KEY_PREFIX}${customerId}`, JSON.stringify(prefs))
}

export function resolveCustomerNotificationPreferences(
  customerId: string,
  customer?: Pick<Customer, 'notification_preferences'>,
): CustomerNotificationPreferences {
  const fromEntity = parsePrefs(customer?.notification_preferences)
  if (fromEntity) return fromEntity
  return getCustomerNotificationPreferences(customerId)
}

export function customerAllowsNotification(
  customerId: string,
  channel: 'email' | 'sms',
  customer?: Pick<Customer, 'notification_preferences'>,
): boolean {
  const prefs = resolveCustomerNotificationPreferences(customerId, customer)
  return channel === 'email' ? prefs.email : prefs.sms
}
