import { describe, it, expect, beforeEach } from 'vitest'
import {
  customerAllowsNotification,
  getCustomerNotificationPreferences,
  saveCustomerNotificationPreferences,
} from './customer-notification-prefs'

describe('customer-notification-prefs', () => {
  const customerId = 'cust-test-001'

  beforeEach(() => {
    localStorage.removeItem(`handymanos_customer_notify_prefs_${customerId}`)
  })

  it('returns default preferences when none stored', () => {
    expect(getCustomerNotificationPreferences(customerId)).toEqual({ email: true, sms: false })
    expect(customerAllowsNotification(customerId, 'email')).toBe(true)
    expect(customerAllowsNotification(customerId, 'sms')).toBe(false)
  })

  it('persists and reads saved preferences', () => {
    saveCustomerNotificationPreferences(customerId, { email: false, sms: true })
    expect(getCustomerNotificationPreferences(customerId)).toEqual({ email: false, sms: true })
    expect(customerAllowsNotification(customerId, 'email')).toBe(false)
    expect(customerAllowsNotification(customerId, 'sms')).toBe(true)
  })
})
