import { describe, it, expect, beforeEach } from 'vitest'
import {
  sendNotification,
  notifyJobScheduled,
  notifyTechnicianSms,
  notifyResultMessage,
  getNotificationQueue,
  getNotificationQueueSize,
  clearNotificationQueue,
  flushNotificationQueue,
} from './notification-service'

describe('notification-service', () => {
  beforeEach(() => {
    clearNotificationQueue()
  })

  it('notifyResultMessage returns demo info for demo success', () => {
    const result = notifyResultMessage(
      { ok: true, demo: true },
      'Live success',
      'Demo message',
      'Failed',
    )
    expect(result).toEqual({ type: 'info', message: 'Demo message' })
  })

  it('notifyResultMessage returns success for live delivery', () => {
    const result = notifyResultMessage(
      { ok: true, demo: false },
      'Live success',
      'Demo message',
      'Failed',
    )
    expect(result).toEqual({ type: 'success', message: 'Live success' })
  })

  it('notifyResultMessage returns error on failure', () => {
    const result = notifyResultMessage(
      { ok: false, demo: false },
      'Live success',
      'Demo message',
      'Failed',
    )
    expect(result).toEqual({ type: 'error', message: 'Failed' })
  })

  it('sendNotification queues demo email payload', async () => {
    const result = await sendNotification({
      to: 'test@example.com',
      subject: 'Test',
      body: 'Hello',
      channel: 'email',
    })
    expect(result).toEqual({ ok: true, demo: true })
    expect(getNotificationQueueSize()).toBe(1)
    expect(getNotificationQueue()[0].to).toBe('test@example.com')
  })

  it('notifyJobScheduled queues customer email', async () => {
    const result = await notifyJobScheduled('cust@example.com', 'Fix faucet', 'Jul 10')
    expect(result.ok).toBe(true)
    expect(result.demo).toBe(true)
    const [item] = getNotificationQueue()
    expect(item.channel).toBe('email')
    expect(item.to).toBe('cust@example.com')
    expect(item.body).toContain('Fix faucet')
  })

  it('notifyTechnicianSms queues SMS in demo mode', async () => {
    const result = await notifyTechnicianSms('(555) 123-4567', 'New job assigned')
    expect(result.ok).toBe(true)
    expect(result.demo).toBe(true)
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
})
