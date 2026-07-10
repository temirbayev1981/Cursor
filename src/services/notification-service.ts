import { getNotificationEndpoint, getSmsEndpoint } from '@/lib/env'
import { getSupabaseAuthHeaders } from '@/lib/supabase'

export type NotificationChannel = 'email' | 'sms' | 'push'

export interface NotificationPayload {
  to: string
  subject?: string
  body: string
  channel: NotificationChannel
  metadata?: Record<string, string>
}

export interface NotificationResult {
  ok: boolean
  /** True when no webhook is configured and the message was queued locally */
  queued: boolean
}

const QUEUE_KEY = 'handymanos_notification_queue'

function loadQueue(): NotificationPayload[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as NotificationPayload[]) : []
  } catch {
    return []
  }
}

function saveQueue(items: NotificationPayload[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(0, 100)))
}

export async function sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
  const webhook = getNotificationEndpoint()

  if (webhook) {
    try {
      const headers = await getSupabaseAuthHeaders()
      const res = await fetch(webhook, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      return { ok: res.ok, queued: false }
    } catch {
      return { ok: false, queued: false }
    }
  }

  const queue = loadQueue()
  queue.unshift({ ...payload, metadata: { ...payload.metadata, sent_at: new Date().toISOString() } })
  saveQueue(queue)
  console.info(`[Notification ${payload.channel}]`, payload.to, payload.subject ?? payload.body.slice(0, 80))
  return { ok: true, queued: true }
}

export async function notifyJobScheduled(customerEmail: string, jobTitle: string, date: string) {
  return sendNotification({
    to: customerEmail,
    subject: `Заказ запланирован: ${jobTitle}`,
    body: `Ваш заказ «${jobTitle}» запланирован на ${date}.`,
    channel: 'email',
    metadata: { type: 'job_scheduled' },
  })
}

export async function notifyInvoiceSent(customerEmail: string, invoiceNumber: string, amount: number) {
  return sendNotification({
    to: customerEmail,
    subject: `Счёт ${invoiceNumber}`,
    body: `Выставлен счёт ${invoiceNumber} на сумму $${amount.toFixed(2)}.`,
    channel: 'email',
    metadata: { type: 'invoice_sent' },
  })
}

export async function notifyEstimateSent(customerEmail: string, title: string, total: number) {
  return sendNotification({
    to: customerEmail,
    subject: `Смета: ${title}`,
    body: `Вам отправлена смета «${title}» на сумму $${total.toFixed(2)}. Пожалуйста, ознакомьтесь и утвердите.`,
    channel: 'email',
    metadata: { type: 'estimate_sent' },
  })
}

export async function sendSms(to: string, body: string): Promise<NotificationResult> {
  const smsWebhook = getSmsEndpoint()
  if (smsWebhook) {
    try {
      const headers = await getSupabaseAuthHeaders()
      const res = await fetch(smsWebhook, {
        method: 'POST',
        headers,
        body: JSON.stringify({ to, body, provider: 'twilio' }),
      })
      return { ok: res.ok, queued: false }
    } catch {
      return { ok: false, queued: false }
    }
  }
  return sendNotification({ to, body, channel: 'sms', metadata: { provider: 'twilio-local' } })
}

export async function notifyTechnicianSms(phone: string, message: string) {
  return sendSms(phone, message)
}

export function getNotificationQueue(): NotificationPayload[] {
  return loadQueue()
}

export function clearNotificationQueue(): void {
  saveQueue([])
}

export function getNotificationQueueSize(): number {
  return loadQueue().length
}

export async function flushNotificationQueue(): Promise<number> {
  const emailEndpoint = getNotificationEndpoint()
  const smsEndpoint = getSmsEndpoint()
  if (!emailEndpoint && !smsEndpoint) return 0

  const queue = loadQueue()
  if (queue.length === 0) return 0

  const remaining: NotificationPayload[] = []
  let sent = 0

  for (const payload of [...queue].reverse()) {
    try {
      if (payload.channel === 'sms' && smsEndpoint) {
        const headers = await getSupabaseAuthHeaders()
        const res = await fetch(smsEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({ to: payload.to, body: payload.body, provider: 'twilio' }),
        })
        if (res.ok) {
          sent++
          continue
        }
      } else if (payload.channel === 'email' && emailEndpoint) {
        const headers = await getSupabaseAuthHeaders()
        const res = await fetch(emailEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          sent++
          continue
        }
      }
      remaining.push(payload)
    } catch {
      remaining.push(payload)
    }
  }

  saveQueue(remaining)
  return sent
}

export function notifyResultMessage(
  result: NotificationResult,
  success: string,
  queued: string,
  failed: string
): { type: 'success' | 'info' | 'error'; message: string } {
  if (result.ok && result.queued) return { type: 'info', message: queued }
  if (result.ok) return { type: 'success', message: success }
  return { type: 'error', message: failed }
}
