import { describe, it, expect, beforeEach } from 'vitest'
import { loadStore, saveStore, mergeStoreById } from '@/lib/data-store'

describe('data-store', () => {
  const key = 'test_merge_store'

  beforeEach(() => {
    localStorage.removeItem(key)
  })

  it('mergeStoreById preserves rows from other tenants', () => {
    saveStore(key, [
      { id: 'a', company_id: 'comp-001', name: 'A' },
      { id: 'b', company_id: 'comp-002', name: 'B' },
    ])
    mergeStoreById(key, [{ id: 'c', company_id: 'comp-001', name: 'C' }])
    const merged = loadStore<{ id: string; company_id: string; name: string }>(key)
    expect(merged).toHaveLength(3)
    expect(merged.find((row) => row.id === 'b')?.name).toBe('B')
    expect(merged.find((row) => row.id === 'c')?.name).toBe('C')
  })

  it('mergeStoreById updates existing ids', () => {
    saveStore(key, [{ id: 'a', company_id: 'comp-001', name: 'Old' }])
    mergeStoreById(key, [{ id: 'a', company_id: 'comp-001', name: 'New' }])
    expect(loadStore<{ id: string; name: string }>(key)[0].name).toBe('New')
  })
})
