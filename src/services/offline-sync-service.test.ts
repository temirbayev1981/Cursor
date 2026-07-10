import { describe, it, expect } from 'vitest'
import { applyOfflineAction } from './offline-sync-service'

describe('offline-sync-service', () => {
  it('returns false for unknown action types', async () => {
    const result = await applyOfflineAction(
      {
        id: 'x',
        type: 'unknown_action' as 'clock_in',
        payload: {},
        created_at: new Date().toISOString(),
      },
      { companyId: 'comp-001' },
    )
    expect(result).toBe(false)
  })
})
