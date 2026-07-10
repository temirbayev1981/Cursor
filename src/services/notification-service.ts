import { getNotificationEndpoint, getSmsEndpoint } from '@/lib/env'
import { getSupabaseAuthHeaders } from '@/lib/supabase'
import { customerAllowsNotification } from '@/lib/customer-notification-prefs'
import {
  getNotificationSkipLog,
  recordNotificationSkip,
} from '@/lib/notification-skip-log'
import type { Customer } from '@/types'

export type NotificationChannel = 'email' | 'sms' | 'push'
export type NotificationDeliveryStatus = 'queued' | 'sent' | 'failed'
export type NotificationHubFilter = 'all' | NotificationChannel | 'skipped'

export { getNotificationSkipLog, clearNotificationSkipLog, exportNotificationSkipLogCsv } from '@/lib/notification-skip-log'

type NotificationLocale = 'en' | 'ru'

const NOTIFY_TEMPLATES = {
  en: {
    jobScheduledSubject: (title: string) => `Job scheduled: ${title}`,
    jobScheduledBody: (title: string, date: string) => `Your job "${title}" is scheduled for ${date}.`,
    jobEtaSubject: (title: string) => `Technician en route: ${title}`,
    jobEtaBody: (title: string, eta: string) => `Your technician is on the way for "${title}". Estimated arrival: ${eta}.`,
    invoiceSentSubject: (num: string) => `Invoice ${num}`,
    invoiceSentBody: (num: string, amount: number) => `Invoice ${num} for $${amount.toFixed(2)} has been issued.`,
    estimateSentSubject: (title: string) => `Estimate: ${title}`,
    estimateSentBody: (title: string, total: number) =>
      `Estimate "${title}" for $${total.toFixed(2)} has been sent. Please review and approve.`,
    bulkTechSms: (count: number) => `You have ${count} job(s) scheduled today. Check HandymanOS for details.`,
  },
  ru: {
    jobScheduledSubject: (title: string) => `Заказ запланирован: ${title}`,
    jobScheduledBody: (title: string, date: string) => `Ваш заказ «${title}» запланирован на ${date}.`,
    jobEtaSubject: (title: string) => `Мастер в пути: ${title}`,
    jobEtaBody: (title: string, eta: string) => `Мастер направляется по заказу «${title}». Ориентировочное прибытие: ${eta}.`,
    invoiceSentSubject: (num: string) => `Счёт ${num}`,
    invoiceSentBody: (num: string, amount: number) => `Выставлен счёт ${num} на сумму $${amount.toFixed(2)}.`,
    estimateSentSubject: (title: string) => `Смета: ${title}`,
    estimateSentBody: (title: string, total: number) =>
      `Вам отправлена смета «${title}» на сумму $${total.toFixed(2)}. Пожалуйста, ознакомьтесь и утвердите.`,
    bulkTechSms: (count: number) => `У вас ${count} заказ(ов) на сегодня. Подробности в HandymanOS.`,
  },
} as const

function getNotificationLocale(): NotificationLocale {
  if (typeof localStorage === 'undefined') return 'en'
  return localStorage.getItem('handymanos_locale') === 'ru' ? 'ru' : 'en'
}

function notifyTemplates() {
  return NOTIFY_TEMPLATES[getNotificationLocale()]
}

export interface NotificationPayload {
  to: string
  subject?: string
  body: string
  channel: NotificationChannel
  metadata?: Record<string, string>
}

export interface QueuedNotification extends NotificationPayload {
  id: string
  status: NotificationDeliveryStatus
  attempts: number
  created_at: string
  last_attempt_at?: string
  error?: string
}

export interface NotificationResult {
  ok: boolean
  queued: boolean
  skipped?: boolean
}

const QUEUE_KEY = 'handymanos_notification_queue'

function normalizeQueuedItem(raw: unknown): QueuedNotification {
  if (raw && typeof raw === 'object' && 'id' in raw && 'status' in raw) {
    return raw as QueuedNotification
  }
  const legacy = raw as NotificationPayload
  return {
    ...legacy,
    id: crypto.randomUUID(),
    status: 'queued',
    attempts: 0,
    created_at: legacy.metadata?.sent_at ?? new Date().toISOString(),
  }
}

function loadQueue(): QueuedNotification[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    return (JSON.parse(raw) as unknown[]).map(normalizeQueuedItem)
  } catch {
    return []
  }
}

function saveQueue(items: QueuedNotification[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(0, 100)))
}

function enqueue(payload: NotificationPayload): QueuedNotification {
  const item: QueuedNotification = {
    ...payload,
    id: crypto.randomUUID(),
    status: 'queued',
    attempts: 0,
    created_at: new Date().toISOString(),
    metadata: { ...payload.metadata, sent_at: new Date().toISOString() },
  }
  const queue = loadQueue()
  queue.unshift(item)
  saveQueue(queue)
  return item
}

async function deliverPayload(payload: NotificationPayload): Promise<boolean> {
  if (payload.channel === 'sms') {
    const smsEndpoint = getSmsEndpoint()
    if (!smsEndpoint) return false
    const headers = await getSupabaseAuthHeaders()
    const res = await fetch(smsEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ to: payload.to, body: payload.body, provider: 'twilio' }),
    })
    return res.ok
  }

  const emailEndpoint = getNotificationEndpoint()
  if (!emailEndpoint) return false
  const headers = await getSupabaseAuthHeaders()
  const res = await fetch(emailEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  return res.ok
}

export async function sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
  const hasWebhook = payload.channel === 'sms' ? Boolean(getSmsEndpoint()) : Boolean(getNotificationEndpoint())

  if (hasWebhook) {
    try {
      const ok = await deliverPayload(payload)
      return { ok, queued: false }
    } catch {
      return { ok: false, queued: false }
    }
  }

  enqueue(payload)
  console.info(`[Notification ${payload.channel}]`, payload.to, payload.subject ?? payload.body.slice(0, 80))
  return { ok: true, queued: true }
}

function skipCustomerEmail(
  to: string,
  subject: string,
  body: string,
  metadata?: Record<string, string>,
): NotificationResult {
  recordNotificationSkip({ to, channel: 'email', subject, body, metadata })
  return { ok: true, queued: false, skipped: true }
}

export async function notifyJobScheduled(
  customerEmail: string,
  jobTitle: string,
  date: string,
  customerId?: string,
  customer?: Pick<Customer, 'notification_preferences'>,
) {
  const tpl = notifyTemplates()
  if (customerId && !customerAllowsNotification(customerId, 'email', customer)) {
    return skipCustomerEmail(
      customerEmail,
      tpl.jobScheduledSubject(jobTitle),
      tpl.jobScheduledBody(jobTitle, date),
      { type: 'job_scheduled', customer_id: customerId },
    )
  }
  return sendNotification({
    to: customerEmail,
    subject: tpl.jobScheduledSubject(jobTitle),
    body: tpl.jobScheduledBody(jobTitle, date),
    channel: 'email',
    metadata: { type: 'job_scheduled' },
  })
}

export async function notifyCustomerEta(
  customerEmail: string,
  jobTitle: string,
  eta: string,
  customerId?: string,
  customer?: Pick<Customer, 'notification_preferences'>,
) {
  const tpl = notifyTemplates()
  if (customerId && !customerAllowsNotification(customerId, 'email', customer)) {
    return skipCustomerEmail(
      customerEmail,
      tpl.jobEtaSubject(jobTitle),
      tpl.jobEtaBody(jobTitle, eta),
      { type: 'job_eta', customer_id: customerId },
    )
  }
  return sendNotification({
    to: customerEmail,
    subject: tpl.jobEtaSubject(jobTitle),
    body: tpl.jobEtaBody(jobTitle, eta),
    channel: 'email',
    metadata: { type: 'job_eta' },
  })
}

export async function notifyInvoiceSent(
  customerEmail: string,
  invoiceNumber: string,
  amount: number,
  customerId?: string,
  customer?: Pick<Customer, 'notification_preferences'>,
) {
  const tpl = notifyTemplates()
  if (customerId && !customerAllowsNotification(customerId, 'email', customer)) {
    return skipCustomerEmail(
      customerEmail,
      tpl.invoiceSentSubject(invoiceNumber),
      tpl.invoiceSentBody(invoiceNumber, amount),
      { type: 'invoice_sent', customer_id: customerId },
    )
  }
  return sendNotification({
    to: customerEmail,
    subject: tpl.invoiceSentSubject(invoiceNumber),
    body: tpl.invoiceSentBody(invoiceNumber, amount),
    channel: 'email',
    metadata: { type: 'invoice_sent' },
  })
}

export async function notifyEstimateSent(
  customerEmail: string,
  title: string,
  total: number,
  customerId?: string,
  customer?: Pick<Customer, 'notification_preferences'>,
) {
  const tpl = notifyTemplates()
  if (customerId && !customerAllowsNotification(customerId, 'email', customer)) {
    return skipCustomerEmail(
      customerEmail,
      tpl.estimateSentSubject(title),
      tpl.estimateSentBody(title, total),
      { type: 'estimate_sent', customer_id: customerId },
    )
  }
  return sendNotification({
    to: customerEmail,
    subject: tpl.estimateSentSubject(title),
    body: tpl.estimateSentBody(title, total),
    channel: 'email',
    metadata: { type: 'estimate_sent' },
  })
}

export async function sendSms(to: string, body: string): Promise<NotificationResult> {
  return sendNotification({ to, body, channel: 'sms', metadata: { provider: 'twilio-local' } })
}

export async function notifyTechnicianSms(phone: string, message: string) {
  return sendSms(phone, message)
}

export async function notifyBulkTechnicianSms(
  technicians: { phone?: string; jobCount: number }[],
): Promise<{ sent: number; queued: number; failed: number }> {
  const tpl = notifyTemplates()
  let sent = 0
  let queued = 0
  let failed = 0

  for (const tech of technicians) {
    if (!tech.phone || tech.jobCount === 0) continue
    const result = await sendSms(tech.phone, tpl.bulkTechSms(tech.jobCount))
    if (result.ok && result.queued) queued++
    else if (result.ok) sent++
    else failed++
  }

  return { sent, queued, failed }
}

export function getNotificationQueue(): QueuedNotification[] {
  return loadQueue()
}

export function getNotificationQueueFiltered(filter: NotificationHubFilter = 'all'): QueuedNotification[] {
  const queue = loadQueue()
  if (filter === 'all') return queue
  return queue.filter((item) => item.channel === filter)
}

export function getNotificationQueueStats() {
  const queue = loadQueue()
  return {
    total: queue.length,
    queued: queue.filter((i) => i.status === 'queued').length,
    failed: queue.filter((i) => i.status === 'failed').length,
    sent: queue.filter((i) => i.status === 'sent').length,
    skipped: getNotificationSkipLog().length,
  }
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

  let sent = 0
  const updated: QueuedNotification[] = []

  for (const item of [...queue].reverse()) {
    if (item.status === 'sent') {
      updated.push(item)
      continue
    }

    const canDeliver =
      (item.channel === 'sms' && smsEndpoint) ||
      (item.channel === 'email' && emailEndpoint)

    if (!canDeliver) {
      updated.push(item)
      continue
    }

    try {
      const ok = await deliverPayload(item)
      const next: QueuedNotification = {
        ...item,
        attempts: item.attempts + 1,
        last_attempt_at: new Date().toISOString(),
        status: ok ? 'sent' : 'failed',
        error: ok ? undefined : 'Delivery failed',
      }
      if (ok) sent++
      updated.push(next)
    } catch (err) {
      updated.push({
        ...item,
        attempts: item.attempts + 1,
        last_attempt_at: new Date().toISOString(),
        status: 'failed',
        error: err instanceof Error ? err.message : 'Network error',
      })
    }
  }

  saveQueue(updated.reverse())
  return sent
}

export async function retryFailedNotifications(): Promise<number> {
  const queue = loadQueue()
  const failed = queue.filter((i) => i.status === 'failed')
  for (const item of failed) {
    item.status = 'queued'
  }
  saveQueue(queue)
  return flushNotificationQueue()
}

export async function retryNotification(id: string): Promise<boolean> {
  const queue = loadQueue()
  const item = queue.find((i) => i.id === id)
  if (!item) return false
  item.status = 'queued'
  saveQueue(queue)
  const sent = await flushNotificationQueue()
  return sent > 0
}

export function notifyResultMessage(
  result: NotificationResult,
  success: string,
  queued: string,
  failed: string,
  skipped?: string,
): { type: 'success' | 'info' | 'error'; message: string } {
  if (result.ok && result.skipped) return { type: 'info', message: skipped ?? success }
  if (result.ok && result.queued) return { type: 'info', message: queued }
  if (result.ok) return { type: 'success', message: success }
  return { type: 'error', message: failed }
}
