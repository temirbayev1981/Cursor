import { describe, it, expect, beforeEach } from 'vitest'
import { computeSystemMetrics } from './system-metrics'

describe('computeSystemMetrics', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns healthy when queues are empty', () => {
    const metrics = computeSystemMetrics()
    expect(metrics.status).toBe('healthy')
    expect(metrics.errorCount).toBe(0)
    expect(metrics.offlineQueueSize).toBe(0)
    expect(metrics.notificationQueueSize).toBe(0)
  })

  it('marks degraded when offline queue grows', () => {
    const queue = Array.from({ length: 6 }, (_, i) => ({
      id: `a-${i}`,
      type: 'update_job',
      payload: {},
      created_at: new Date().toISOString(),
    }))
    localStorage.setItem('handymanos_offline_queue', JSON.stringify(queue))
    expect(computeSystemMetrics().status).toBe('degraded')
  })
})
