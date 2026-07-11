import { describe, it, expect, beforeEach, vi } from 'vitest'
import { INVENTORY_AUDIT, receiveStock, applyMaterialsOnJob } from './inventory-service'
import * as entityService from '@/services/entity-service'

vi.mock('@/lib/supabase', () => ({
  supabase: null,
}))

describe('inventory-service', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(entityService, 'listEntities').mockResolvedValue([
      {
        id: 'mat-001',
        company_id: 'comp-001',
        name: 'Paint',
        category: 'Paint',
        supplier: 'HD',
        cost: 10,
        markup_percent: 30,
        customer_price: 13,
        quantity: 5,
        reorder_level: 2,
        unit: 'gal',
        created_at: '2026-01-01T00:00:00Z',
      },
    ] as never)
    vi.spyOn(entityService, 'saveEntity').mockImplementation(async (_type, entity) => entity as never)
  })

  it('exports inventory audit gate', () => {
    expect(INVENTORY_AUDIT).toBe(true)
  })

  it('receiveStock increases material quantity', async () => {
    const tx = await receiveStock('comp-001', 'mat-001', 3, 'Restock')
    expect(tx.transaction_type).toBe('receive')
    expect(tx.quantity_change).toBe(3)
    expect(entityService.saveEntity).toHaveBeenCalledWith(
      'materials',
      expect.objectContaining({ id: 'mat-001', quantity: 8 }),
    )
  })

  it('applyMaterialsOnJob deducts stock for job usage', async () => {
    const txs = await applyMaterialsOnJob('comp-001', 'job-001', [{ materialId: 'mat-001', quantity: 2 }])
    expect(txs).toHaveLength(1)
    expect(txs[0]?.transaction_type).toBe('job_usage')
    expect(txs[0]?.quantity_change).toBe(-2)
  })
})
