import { describe, it, expect, beforeEach } from 'vitest'
import {
  sendNotification,
  notifyJobScheduled,
  notifyCustomerEta,
  notifyEstimateSent,
  notifyInvoiceSent,
  notifyTechnicianSms,
  notifyResultMessage,
  getNotificationQueue,
  getNotificationQueueFiltered,
  getNotificationQueueStats,
  getNotificationQueueSize,
  clearNotificationQueue,
  flushNotificationQueue,
  retryFailedNotifications,
} from './notification-service'
import { saveCustomerNotificationPreferences } from '@/lib/customer-notification-prefs'

describe('notification-service', () => {
  beforeEach(() => {
    clearNotificationQueue()
  })

  it('notifyResultMessage returns queued info when message is stored locally', () => {
    const result = notifyResultMessage(
      { ok: true, queued: true },
      'Live success',
      'Queued message',
      'Failed',
    )
    expect(result).toEqual({ type: 'info', message: 'Queued message' })
  })

  it('notifyResultMessage returns success for live delivery', () => {
    const result = notifyResultMessage(
      { ok: true, queued: false },
      'Live success',
      'Queued message',
      'Failed',
    )
    expect(result).toEqual({ type: 'success', message: 'Live success' })
  })

  it('notifyResultMessage returns error on failure', () => {
    const result = notifyResultMessage(
      { ok: false, queued: false },
      'Live success',
      'Queued message',
      'Failed',
    )
    expect(result).toEqual({ type: 'error', message: 'Failed' })
  })

  it('sendNotification queues email when no webhook is configured', async () => {
    const result = await sendNotification({
      to: 'test@example.com',
      subject: 'Test',
      body: 'Hello',
      channel: 'email',
    })
    expect(result).toEqual({ ok: true, queued: true })
    expect(getNotificationQueueSize()).toBe(1)
    const [item] = getNotificationQueue()
    expect(item.to).toBe('test@example.com')
    expect(item.status).toBe('queued')
    expect(item.id).toBeTruthy()
  })

  it('notifyJobScheduled uses Russian templates when locale is ru', async () => {
    localStorage.setItem('handymanos_locale', 'ru')
    const result = await notifyJobScheduled('cust@example.com', 'Fix faucet', 'Jul 10')
    expect(result.ok).toBe(true)
    const [item] = getNotificationQueue()
    expect(item.channel).toBe('email')
    expect(item.subject).toContain('запланирован')
    expect(item.body).toContain('Fix faucet')
    localStorage.removeItem('handymanos_locale')
  })

  it('notifyJobScheduled uses English templates by default', async () => {
    localStorage.removeItem('handymanos_locale')
    const result = await notifyJobScheduled('cust@example.com', 'Fix faucet', 'Jul 10')
    expect(result.ok).toBe(true)
    const [item] = getNotificationQueue()
    expect(item.subject).toContain('scheduled')
    expect(item.body).toContain('Fix faucet')
  })

  it('notifyTechnicianSms queues SMS without webhook', async () => {
    const result = await notifyTechnicianSms('(555) 123-4567', 'New job assigned')
    expect(result.ok).toBe(true)
    expect(result.queued).toBe(true)
    const [item] = getNotificationQueue()
    expect(item.channel).toBe('sms')
    expect(item.to).toBe('(555) 123-4567')
  })

  it('flushNotificationQueue returns 0 without webhooks configured', async () => {
    await sendNotification({ to: 'a@b.com', body: 'x', channel: 'email' })
    expect(getNotificationQueueSize()).toBe(1)
    const sent = await flushNotificationQueue()
    expect(sent).toBe(0)
    expect(getNotificationQueueSize()).toBe(1)
  })

  it('clearNotificationQueue empties the queue', async () => {
    await sendNotification({ to: 'a@b.com', body: 'x', channel: 'email' })
    clearNotificationQueue()
    expect(getNotificationQueueSize()).toBe(0)
  })

  it('getNotificationQueueFiltered filters by channel', async () => {
    await sendNotification({ to: 'a@b.com', body: 'email', channel: 'email' })
    await notifyTechnicianSms('555', 'sms')
    expect(getNotificationQueueFiltered('email')).toHaveLength(1)
    expect(getNotificationQueueFiltered('sms')).toHaveLength(1)
    expect(getNotificationQueueStats().total).toBe(2)
  })

  it('retryFailedNotifications re-queues failed items', async () => {
    await sendNotification({ to: 'a@b.com', body: 'x', channel: 'email' })
    const queue = getNotificationQueue()
    queue[0].status = 'failed'
    localStorage.setItem('handymanos_notification_queue', JSON.stringify(queue))
    const retried = await retryFailedNotifications()
    expect(retried).toBe(0)
    expect(getNotificationQueue()[0].status).toBe('queued')
  })

  it('notifyJobScheduled skips email when customer disabled email prefs', async () => {
    saveCustomerNotificationPreferences('cust-no-email', { email: false, sms: false })
    const result = await notifyJobScheduled('cust@example.com', 'Fix', 'Jul 10', 'cust-no-email')
    expect(result).toEqual({ ok: true, queued: false, skipped: true })
    expect(getNotificationQueueSize()).toBe(0)
    localStorage.removeItem('handymanos_customer_notify_prefs_cust-no-email')
  })

  it('notifyCustomerEta uses English templates by default', async () => {
    const result = await notifyCustomerEta('cust@example.com', 'Fix faucet', '30 min')
    expect(result.ok).toBe(true)
    const [item] = getNotificationQueue()
    expect(item.subject).toContain('en route')
  })

  it('notifyEstimateSent skips email when customer disabled email prefs', async () => {
    saveCustomerNotificationPreferences('cust-no-email', { email: false, sms: false })
    const result = await notifyEstimateSent('cust@example.com', 'Estimate', 100, 'cust-no-email')
    expect(result).toEqual({ ok: true, queued: false, skipped: true })
    expect(getNotificationQueueSize()).toBe(0)
    localStorage.removeItem('handymanos_customer_notify_prefs_cust-no-email')
  })

  it('notifyInvoiceSent skips email when customer disabled email prefs', async () => {
    saveCustomerNotificationPreferences('cust-no-email', { email: false, sms: false })
    const result = await notifyInvoiceSent('cust@example.com', 'INV-1', 50, 'cust-no-email')
    expect(result).toEqual({ ok: true, queued: false, skipped: true })
    expect(getNotificationQueueSize()).toBe(0)
    localStorage.removeItem('handymanos_customer_notify_prefs_cust-no-email')
  })
})
