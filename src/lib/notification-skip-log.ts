export type NotificationSkipReason = 'customer_opt_out'

export interface SkippedNotification {
  id: string
  to: string
  channel: 'email' | 'sms'
  subject?: string
  body: string
  reason: NotificationSkipReason
  metadata?: Record<string, string>
  created_at: string
}

const SKIP_LOG_KEY = 'handymanos_notification_skip_log'
const MAX_SKIP_LOG = 50

function loadSkipLog(): SkippedNotification[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(SKIP_LOG_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SkippedNotification[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveSkipLog(items: SkippedNotification[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(SKIP_LOG_KEY, JSON.stringify(items.slice(0, MAX_SKIP_LOG)))
}

export function recordNotificationSkip(entry: Omit<SkippedNotification, 'id' | 'created_at' | 'reason'> & { reason?: NotificationSkipReason }): void {
  const log = loadSkipLog()
  log.unshift({
    ...entry,
    id: crypto.randomUUID(),
    reason: entry.reason ?? 'customer_opt_out',
    created_at: new Date().toISOString(),
  })
  saveSkipLog(log)
}

export function getNotificationSkipLog(): SkippedNotification[] {
  return loadSkipLog()
}

export function getNotificationSkipLogFiltered(channel: 'all' | 'email' | 'sms' = 'all'): SkippedNotification[] {
  const log = loadSkipLog()
  if (channel === 'all') return log
  return log.filter((item) => item.channel === channel)
}

export function getNotificationSkipLogStats(): { total: number; email: number; sms: number } {
  const log = loadSkipLog()
  return {
    total: log.length,
    email: log.filter((item) => item.channel === 'email').length,
    sms: log.filter((item) => item.channel === 'sms').length,
  }
}

export function clearNotificationSkipLog(): void {
  saveSkipLog([])
}

export function exportNotificationSkipLogCsv(): string {
  const header = 'created_at,to,channel,subject,body,reason'
  const rows = getNotificationSkipLog().map((item) => [
    item.created_at,
    item.to,
    item.channel,
    item.subject ?? '',
    item.body.replace(/"/g, '""'),
    item.reason,
  ].map((value) => `"${value}"`).join(','))
  return [header, ...rows].join('\n')
}
