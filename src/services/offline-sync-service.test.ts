import { describe, it, expect, beforeEach } from 'vitest'
import { applyOfflineAction } from './offline-sync-service'
import { loadStore, saveStore, STORE_KEYS } from '@/lib/data-store'
import type { Job } from '@/types'

describe('offline-sync-service', () => {
  beforeEach(() => {
    saveStore(STORE_KEYS.timeEntries, [])
  })

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

  it('applies clock_in and persists local time entry', async () => {
    const entry = {
      id: 'te-offline-1',
      job_id: 'job-001',
      start: '2026-07-10T10:00:00Z',
    }
    const ok = await applyOfflineAction(
      {
        id: entry.id,
        type: 'clock_in',
        payload: entry,
        created_at: entry.start,
      },
      { companyId: 'comp-001', employeeId: 'emp-001', profileId: 'user-001' },
    )
    expect(ok).toBe(true)
    const stored = loadStore<{ id: string; start?: string; start_time?: string }>(STORE_KEYS.timeEntries)
    const match = stored.find((e) => e.id === entry.id)
    expect(match).toBeDefined()
    expect(match?.start ?? match?.start_time).toBe(entry.start)
  })

  it('applies update_job and saves job entity', async () => {
    const job: Job = {
      id: 'job-offline-update',
      company_id: 'comp-001',
      customer_id: 'cust-001',
      title: 'Offline update test',
      description: 'Updated offline',
      status: 'in_progress',
      priority: 'medium',
      estimated_hours: 1,
      actual_hours: 0,
      revenue: 100,
      labor_cost: 0,
      material_cost: 0,
      fuel_cost: 0,
      overhead_cost: 0,
      profit: 0,
      profit_margin: 0,
      created_at: '2026-07-10T00:00:00Z',
    }
    const ok = await applyOfflineAction(
      {
        id: 'action-update',
        type: 'update_job',
        payload: { job },
        created_at: new Date().toISOString(),
      },
      { companyId: 'comp-001' },
    )
    expect(ok).toBe(true)
    const jobs = loadStore<Job>(STORE_KEYS.jobs)
    expect(jobs.find((j) => j.id === job.id)?.description).toBe('Updated offline')
  })

  it('applies clock_out and closes open time entry', async () => {
    const entry = {
      id: 'te-offline-2',
      job_id: 'job-001',
      start: '2026-07-10T10:00:00Z',
    }
    saveStore(STORE_KEYS.timeEntries, [entry])
    const end = '2026-07-10T12:00:00Z'
    const ok = await applyOfflineAction(
      {
        id: 'action-clock-out',
        type: 'clock_out',
        payload: { job_id: entry.job_id, end },
        created_at: end,
      },
      { companyId: 'comp-001', employeeId: 'emp-001' },
    )
    expect(ok).toBe(true)
    const stored = loadStore<{ job_id: string; end?: string }>(STORE_KEYS.timeEntries)
    expect(stored.find((e) => e.job_id === entry.job_id)?.end).toBe(end)
  })

  it('applies update_job_status and saves job', async () => {
    const job: Job = {
      id: 'job-offline-status',
      company_id: 'comp-001',
      customer_id: 'cust-001',
      title: 'Status change',
      description: 'Done',
      status: 'completed',
      priority: 'low',
      estimated_hours: 1,
      actual_hours: 1,
      revenue: 50,
      labor_cost: 0,
      material_cost: 0,
      fuel_cost: 0,
      overhead_cost: 0,
      profit: 0,
      profit_margin: 0,
      created_at: '2026-07-10T00:00:00Z',
      completed_date: '2026-07-10T12:00:00Z',
    }
    const ok = await applyOfflineAction(
      {
        id: 'action-status',
        type: 'update_job_status',
        payload: { job },
        created_at: new Date().toISOString(),
      },
      { companyId: 'comp-001' },
    )
    expect(ok).toBe(true)
    const jobs = loadStore<Job>(STORE_KEYS.jobs)
    expect(jobs.find((j) => j.id === job.id)?.status).toBe('completed')
  })

  it('applies photo_upload in demo mode', async () => {
    const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    const ok = await applyOfflineAction(
      {
        id: 'action-photo',
        type: 'photo_upload',
        payload: {
          companyId: 'comp-001',
          jobId: 'job-001',
          fileName: 'field.jpg',
          mimeType: 'image/jpeg',
          data: tinyPng,
        },
        created_at: new Date().toISOString(),
      },
      { companyId: 'comp-001' },
    )
    expect(ok).toBe(true)
    const photos = loadStore<{ job_id: string }>(STORE_KEYS.photos)
    expect(photos.some((p) => p.job_id === 'job-001')).toBe(true)
  })
})
