import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePortalContext } from '@/hooks/use-portal-context'
import {
  fetchPortalEstimates,
  fetchPortalInvoices,
  fetchPortalJobs,
  portalApproveEstimate,
  portalSubmitJobRequest,
} from '@/services/portal-data-service'
import { getPortalToken } from '@/services/portal-service'
import { saveEntity } from '@/services/entity-service'
import type { Estimate, Job } from '@/types'

export function usePortalEstimates(portalType: 'customer' | 'property' = 'customer') {
  const portal = usePortalContext(portalType)
  const token = getPortalToken()

  return useQuery({
    queryKey: ['portal-estimates', portal?.companyId, portal?.customerId, token],
    queryFn: () => fetchPortalEstimates(portal!),
    enabled: Boolean(portal),
  })
}

export function usePortalInvoices(portalType: 'customer' | 'property' = 'customer') {
  const portal = usePortalContext(portalType)
  const token = getPortalToken()

  return useQuery({
    queryKey: ['portal-invoices', portal?.companyId, portal?.customerId, token],
    queryFn: () => fetchPortalInvoices(portal!),
    enabled: Boolean(portal),
  })
}

export function usePortalJobs() {
  const portal = usePortalContext('property')
  const token = getPortalToken()

  return useQuery({
    queryKey: ['portal-jobs', portal?.companyId, portal?.customerId, token],
    queryFn: () => fetchPortalJobs(portal!),
    enabled: Boolean(portal),
  })
}

export function usePortalEstimateAction() {
  const qc = useQueryClient()
  const portal = usePortalContext('customer')
  const token = getPortalToken()

  return useMutation({
    mutationFn: async ({ estimate, status }: { estimate: Estimate; status: Estimate['status'] }) => {
      if (status !== 'approved' && status !== 'rejected') return false

      if (token && portal) {
        const ok = await portalApproveEstimate(estimate.id, status)
        if (ok) return true
      }

      await saveEntity('estimates', { ...estimate, status })
      return true
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-estimates'] })
    },
  })
}

export function usePortalJobSubmit() {
  const qc = useQueryClient()
  const portal = usePortalContext('property')
  const token = getPortalToken()

  return useMutation({
    mutationFn: async (job: Job) => {
      if (token && portal) {
        const id = await portalSubmitJobRequest(job.title, job.description, job.priority)
        if (id) return id
      }

      await saveEntity('jobs', job)
      return job.id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-jobs'] })
    },
  })
}
