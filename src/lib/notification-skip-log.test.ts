import { describe, it, expect, beforeEach } from 'vitest'
import {
  recordNotificationSkip,
  getNotificationSkipLog,
  clearNotificationSkipLog,
  exportNotificationSkipLogCsv,
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

  it('exportNotificationSkipLogCsv includes header and skipped row', () => {
    recordNotificationSkip({
      to: 'skip@example.com',
      channel: 'email',
      subject: 'Estimate: Deck',
      body: 'Estimate body',
    })
    const csv = exportNotificationSkipLogCsv()
    expect(csv).toContain('created_at,to,channel,subject,body,reason')
    expect(csv).toContain('skip@example.com')
    expect(csv).toContain('customer_opt_out')
  })
})
