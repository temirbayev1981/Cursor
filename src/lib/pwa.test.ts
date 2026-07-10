import { describe, it, expect, beforeEach } from 'vitest'
import {
  queueOfflineAction,
  getOfflineQueue,
  clearOfflineQueue,
  removeOfflineActions,
  syncOfflineQueue,
} from './pwa'

describe('pwa offline queue', () => {
  beforeEach(() => {
    clearOfflineQueue()
  })

  it('queues and retrieves offline actions', () => {
    queueOfflineAction('job_update', { jobId: 'job-001' })
    const queue = getOfflineQueue()
    expect(queue).toHaveLength(1)
    expect(queue[0].type).toBe('job_update')
  })

  it('syncOfflineQueue removes successful actions', async () => {
    queueOfflineAction('a', { id: 1 })
    queueOfflineAction('b', { id: 2 })
    const result = await syncOfflineQueue(async () => true)
    expect(result.processed).toBe(2)
    expect(getOfflineQueue()).toHaveLength(0)
  })

  it('removeOfflineActions keeps unsynced items', () => {
    queueOfflineAction('a', {})
    queueOfflineAction('b', {})
    const [first] = getOfflineQueue()
    removeOfflineActions([first.id])
    expect(getOfflineQueue()).toHaveLength(1)
  })
})
