import { getErrorReports } from '@/lib/observability'
import { getOfflineQueue } from '@/lib/pwa'
import { getNotificationQueue } from '@/services/notification-service'

export type SystemHealthStatus = 'healthy' | 'degraded' | 'critical'

export interface SystemMetrics {
  errorCount: number
  errorsLast24h: number
  offlineQueueSize: number
  notificationQueueSize: number
  lastErrorAt: string | null
  status: SystemHealthStatus
}

const DAY_MS = 86_400_000

export function computeSystemMetrics(now = Date.now()): SystemMetrics {
  const errors = getErrorReports()
  const errorsLast24h = errors.filter((e) => now - new Date(e.timestamp).getTime() < DAY_MS).length
  const offlineQueueSize = getOfflineQueue().length
  const notificationQueueSize = getNotificationQueue().length

  let status: SystemHealthStatus = 'healthy'
  if (errors.length > 10 || offlineQueueSize > 5 || errorsLast24h > 3 || notificationQueueSize > 10) {
    status = 'degraded'
  }
  if (errors.length > 25 || offlineQueueSize > 15 || errorsLast24h > 10 || notificationQueueSize > 25) {
    status = 'critical'
  }

  return {
    errorCount: errors.length,
    errorsLast24h,
    offlineQueueSize,
    notificationQueueSize,
    lastErrorAt: errors[0]?.timestamp ?? null,
    status,
  }
}
