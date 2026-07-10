import { describe, it, expect, beforeEach } from 'vitest'
import {
  recordNotificationSkip,
  getNotificationSkipLog,
  getNotificationSkipLogFiltered,
  getNotificationSkipLogStats,
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

  it('getNotificationSkipLogStats counts email and sms skips', () => {
    recordNotificationSkip({ to: 'a@b.com', channel: 'email', body: 'email body' })
    recordNotificationSkip({ to: '+1555', channel: 'sms', body: 'sms body' })
    recordNotificationSkip({ to: 'c@d.com', channel: 'email', body: 'email body 2' })

    expect(getNotificationSkipLogStats()).toEqual({ total: 3, email: 2, sms: 1 })
  })

  it('getNotificationSkipLogFiltered returns channel-specific skips', () => {
    recordNotificationSkip({ to: 'a@b.com', channel: 'email', body: 'email body' })
    recordNotificationSkip({ to: '+1555', channel: 'sms', body: 'sms body' })
    expect(getNotificationSkipLogFiltered('email')).toHaveLength(1)
    expect(getNotificationSkipLogFiltered('email')[0]?.channel).toBe('email')
    expect(getNotificationSkipLogFiltered('sms')).toHaveLength(1)
    expect(getNotificationSkipLogFiltered('sms')[0]?.channel).toBe('sms')
    expect(getNotificationSkipLogFiltered('all')).toHaveLength(2)
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
