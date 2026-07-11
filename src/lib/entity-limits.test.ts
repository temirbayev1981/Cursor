import { describe, it, expect } from 'vitest'
import { ENTITY_LIST_LIMIT } from '@/lib/entity-limits'

describe('entity-limits', () => {
  it('caps Supabase list fetches at a reasonable row count', () => {
    expect(ENTITY_LIST_LIMIT).toBeGreaterThanOrEqual(100)
    expect(ENTITY_LIST_LIMIT).toBeLessThanOrEqual(2000)
  })
})
