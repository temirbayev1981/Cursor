export type NotificationChannel = 'email' | 'sms' | 'push'

export interface NotificationPayload {
  to: string
  subject?: string
  body: string
  channel: NotificationChannel
  metadata?: Record<string, string>
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

export async function sendNotification(payload: NotificationPayload): Promise<{ ok: boolean; demo: boolean }> {
  const webhook = import.meta.env.VITE_NOTIFICATION_WEBHOOK_URL as string | undefined

  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      return { ok: res.ok, demo: false }
    } catch {
      return { ok: false, demo: false }
    }
  }

  const queue = loadQueue()
  queue.unshift({ ...payload, metadata: { ...payload.metadata, sent_at: new Date().toISOString() } })
  saveQueue(queue)
  console.info(`[Notification ${payload.channel}]`, payload.to, payload.subject ?? payload.body.slice(0, 80))
  return { ok: true, demo: true }
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

export async function sendSms(to: string, body: string): Promise<{ ok: boolean; demo: boolean }> {
  const smsWebhook = import.meta.env.VITE_SMS_WEBHOOK_URL as string | undefined
  if (smsWebhook) {
    try {
      const res = await fetch(smsWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, body, provider: 'twilio' }),
      })
      return { ok: res.ok, demo: false }
    } catch {
      return { ok: false, demo: false }
    }
  }
  return sendNotification({ to, body, channel: 'sms', metadata: { provider: 'twilio-demo' } })
}

export async function notifyTechnicianSms(phone: string, message: string) {
  return sendSms(phone, message)
}

export function getNotificationQueue(): NotificationPayload[] {
  return loadQueue()
}
