import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { usePortalEstimateAction, usePortalJobSubmit } from './use-portal-data'
import type { Estimate, Job } from '@/types'

vi.mock('@/hooks/use-portal-context', () => ({
  usePortalContext: vi.fn(() => ({
    companyId: 'comp-001',
    customerId: 'cust-002',
    customerName: 'Test Customer',
    isMagicLink: true,
  })),
}))

vi.mock('@/services/portal-service', () => ({
  getPortalToken: vi.fn(() => 'portal-token'),
}))

vi.mock('@/services/portal-data-service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/portal-data-service')>()
  return {
    ...actual,
    portalApproveEstimate: vi.fn(actual.portalApproveEstimate),
    portalSubmitJobRequest: vi.fn(actual.portalSubmitJobRequest),
  }
})

vi.mock('@/services/entity-service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/entity-service')>()
  return {
    ...actual,
    saveEntity: vi.fn(),
    logAudit: vi.fn(),
  }
})

import { portalApproveEstimate, portalSubmitJobRequest } from '@/services/portal-data-service'
import { saveEntity, logAudit } from '@/services/entity-service'

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return createElement(QueryClientProvider, { client }, children)
}

const estimate: Estimate = {
  id: 'est-004',
  company_id: 'comp-001',
  customer_id: 'cust-002',
  job_id: 'job-001',
  title: 'Test estimate',
  status: 'sent',
  labor_hours: 1,
  labor_rate: 100,
  material_cost: 0,
  markup_percent: 0,
  total: 100,
  valid_until: new Date().toISOString(),
  created_at: new Date().toISOString(),
  line_items: [],
}

const job: Job = {
  id: 'job-new',
  company_id: 'comp-001',
  customer_id: 'cust-002',
  title: 'Portal request',
  description: 'Fix leak',
  status: 'draft',
  priority: 'medium',
  estimated_hours: 2,
  actual_hours: 0,
  revenue: 0,
  labor_cost: 0,
  material_cost: 0,
  fuel_cost: 0,
  overhead_cost: 0,
  profit: 0,
  profit_margin: 0,
  created_at: new Date().toISOString(),
}

describe('use-portal-data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects estimate action when RPC fails (no saveEntity fallback)', async () => {
    vi.mocked(portalApproveEstimate).mockResolvedValueOnce(false)
    const { result } = renderHook(() => usePortalEstimateAction(), { wrapper })

    await expect(
      result.current.mutateAsync({ estimate, status: 'approved' }),
    ).rejects.toThrow(/failed to update estimate status/i)

    expect(saveEntity).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('logs audit when estimate is approved via RPC', async () => {
    vi.mocked(portalApproveEstimate).mockResolvedValueOnce(true)
    const { result } = renderHook(() => usePortalEstimateAction(), { wrapper })

    await result.current.mutateAsync({ estimate, status: 'approved' })

    await waitFor(() => {
      expect(logAudit).toHaveBeenCalledWith(
        'comp-001',
        'cust-002',
        'portal.estimate_approve',
        'estimate',
        'est-004',
      )
    })
    expect(saveEntity).not.toHaveBeenCalled()
  })

  it('rejects job submit when RPC fails (no saveEntity fallback)', async () => {
    vi.mocked(portalSubmitJobRequest).mockResolvedValueOnce(null)
    const { result } = renderHook(() => usePortalJobSubmit(), { wrapper })

    await expect(result.current.mutateAsync(job)).rejects.toThrow(/failed to submit job request/i)

    expect(saveEntity).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('logs audit when job is submitted via RPC', async () => {
    vi.mocked(portalSubmitJobRequest).mockResolvedValueOnce('job-rpc-001')
    const { result } = renderHook(() => usePortalJobSubmit(), { wrapper })

    await result.current.mutateAsync(job)

    await waitFor(() => {
      expect(logAudit).toHaveBeenCalledWith(
        'comp-001',
        'cust-002',
        'portal.job_submit',
        'job',
        'job-rpc-001',
      )
    })
    expect(saveEntity).not.toHaveBeenCalled()
  })
})
