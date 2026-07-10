export interface CustomerNotificationPreferences {
  email: boolean
  sms: boolean
}

const PREFS_KEY_PREFIX = 'handymanos_customer_notify_prefs_'

const DEFAULT_PREFS: CustomerNotificationPreferences = {
  email: true,
  sms: false,
}

export function getCustomerNotificationPreferences(customerId: string): CustomerNotificationPreferences {
  if (typeof localStorage === 'undefined') return DEFAULT_PREFS
  try {
    const raw = localStorage.getItem(`${PREFS_KEY_PREFIX}${customerId}`)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw) as CustomerNotificationPreferences
    return {
      email: parsed.email ?? true,
      sms: parsed.sms ?? false,
    }
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

export function customerAllowsNotification(
  customerId: string,
  channel: 'email' | 'sms',
): boolean {
  const prefs = getCustomerNotificationPreferences(customerId)
  return channel === 'email' ? prefs.email : prefs.sms
}
