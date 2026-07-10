import { describe, it, expect, beforeEach } from 'vitest'
import {
  recordNotificationSkip,
  getNotificationSkipLog,
  clearNotificationSkipLog,
} from './notification-skip-log'

describe('notification-skip-log', () => {
  beforeEach(() => {
    clearNotificationSkipLog()
  })

  it('records skipped customer email notifications', () => {
    recordNotificationSkip({
      to: 'optout@example.com',
      channel: 'email',
      subject: 'Estimate: Test',
      body: 'Estimate body',
      metadata: { type: 'estimate_sent' },
    })

    const log = getNotificationSkipLog()
    expect(log).toHaveLength(1)
    expect(log[0]?.to).toBe('optout@example.com')
    expect(log[0]?.reason).toBe('customer_opt_out')
  })
})
