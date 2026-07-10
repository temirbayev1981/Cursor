import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePortalContext } from '@/hooks/use-portal-context'
import {
  fetchPortalEstimates,
  fetchPortalInvoices,
  fetchPortalJobs,
  portalApproveEstimate,
  portalSubmitJobRequest,
  portalSubmitReview,
} from '@/services/portal-data-service'
import { getPortalToken } from '@/services/portal-service'
import { logAudit } from '@/services/entity-service'
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
      if (!token || !portal) throw new Error('Portal session required')

      const ok = await portalApproveEstimate(estimate.id, status)
      if (!ok) throw new Error('Failed to update estimate status')
      return true
    },
    onSuccess: (_data, { estimate, status }) => {
      if (portal) {
        const action = status === 'approved' ? 'portal.estimate_approve' : 'portal.estimate_decline'
        void logAudit(portal.companyId, portal.customerId, action, 'estimate', estimate.id)
      }
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
      if (!token || !portal) throw new Error('Portal session required')

      const id = await portalSubmitJobRequest(job.title, job.description, job.priority)
      if (!id) throw new Error('Failed to submit job request')
      return id
    },
    onSuccess: (jobId) => {
      if (portal) void logAudit(portal.companyId, portal.customerId, 'portal.job_submit', 'job', jobId)
      qc.invalidateQueries({ queryKey: ['portal-jobs'] })
    },
  })
}

export function usePortalReviewSubmit() {
  const portal = usePortalContext('customer')

  return useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment: string }) => {
      if (!portal) return false
      return portalSubmitReview(portal, rating, comment)
    },
    onSuccess: (ok) => {
      if (ok && portal) {
        void logAudit(portal.companyId, portal.customerId, 'portal.review_submit', 'customer', portal.customerId)
      }
    },
  })
}
