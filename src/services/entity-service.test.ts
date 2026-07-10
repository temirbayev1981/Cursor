import { describe, it, expect, beforeEach } from 'vitest'
import {
  listEntities,
  saveEntity,
  deleteEntity,
  logAudit,
} from './entity-service'
import { STORE_KEYS } from '@/lib/data-store'

describe('entity-service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loads sample jobs scoped to company', async () => {
    const jobs = await listEntities('jobs', 'comp-001')
    expect(jobs.length).toBeGreaterThan(0)
    expect(jobs.every((job) => job.company_id === 'comp-001')).toBe(true)
  })

  it('upserts entity into local store', async () => {
    const job = {
      id: 'job-test-1',
      company_id: 'comp-001',
      customer_id: 'cust-001',
      title: 'Test job',
      description: '',
      status: 'draft' as const,
      priority: 'medium' as const,
      estimated_hours: 1,
      actual_hours: 0,
      revenue: 100,
      labor_cost: 0,
      material_cost: 0,
      fuel_cost: 0,
      overhead_cost: 0,
      profit: 0,
      profit_margin: 0,
      created_at: new Date().toISOString(),
    }
    await saveEntity('jobs', job)
    const jobs = await listEntities('jobs', 'comp-001')
    expect(jobs.some((item) => item.id === 'job-test-1')).toBe(true)
  })

  it('deletes entity from local store', async () => {
    const job = {
      id: 'job-delete-1',
      company_id: 'comp-001',
      customer_id: 'cust-001',
      title: 'Delete me',
      description: '',
      status: 'draft' as const,
      priority: 'low' as const,
      estimated_hours: 1,
      actual_hours: 0,
      revenue: 50,
      labor_cost: 0,
      material_cost: 0,
      fuel_cost: 0,
      overhead_cost: 0,
      profit: 0,
      profit_margin: 0,
      created_at: new Date().toISOString(),
    }
    await saveEntity('jobs', job)
    await deleteEntity('jobs', 'job-delete-1')
    const stored = JSON.parse(localStorage.getItem(STORE_KEYS.jobs) || '[]') as Array<{ id: string }>
    expect(stored.some((item) => item.id === 'job-delete-1')).toBe(false)
  })

  it('trims audit log cache to 500 entries', async () => {
    for (let i = 0; i < 505; i++) {
      await logAudit('comp-001', 'user-001', 'test.action', 'job', `job-${i}`)
    }
    const logs = JSON.parse(localStorage.getItem(STORE_KEYS.auditLogs) || '[]') as unknown[]
    expect(logs.length).toBeLessThanOrEqual(500)
  })
})
