import type { Estimate, Invoice, Job } from '@/types'
import { DEMO_MODE } from '@/lib/supabase'
import { callRpc } from '@/lib/supabase-rpc'
import { listEntities } from '@/services/entity-service'
import { getPortalToken } from '@/services/portal-service'
import type { PortalContext } from '@/types/portal'

async function fetchPortalRows<T extends Estimate | Invoice | Job>(
  rpc: 'get_portal_estimates' | 'get_portal_invoices' | 'get_portal_jobs',
  portal: PortalContext,
  entity: 'estimates' | 'invoices' | 'jobs',
  filter: (rows: T[]) => T[],
): Promise<T[]> {
  const token = getPortalToken()

  if (DEMO_MODE || !token) {
    const rows = await listEntities(entity, portal.companyId) as T[]
    return filter(rows)
  }

  const { data, error } = await callRpc(rpc, { p_token: token })
  if (error || !data) {
    const rows = await listEntities(entity, portal.companyId) as T[]
    return filter(rows)
  }

  return data as T[]
}

export async function fetchPortalEstimates(portal: PortalContext): Promise<Estimate[]> {
  return fetchPortalRows(
    'get_portal_estimates',
    portal,
    'estimates',
    (rows) => rows.filter((row) => row.customer_id === portal.customerId),
  )
}

export async function fetchPortalInvoices(portal: PortalContext): Promise<Invoice[]> {
  return fetchPortalRows(
    'get_portal_invoices',
    portal,
    'invoices',
    (rows) => rows.filter((row) => row.customer_id === portal.customerId),
  )
}

export async function fetchPortalJobs(portal: PortalContext): Promise<Job[]> {
  return fetchPortalRows(
    'get_portal_jobs',
    portal,
    'jobs',
    (rows) => rows.filter((row) => row.customer_id === portal.customerId),
  )
}

export async function portalApproveEstimate(
  estimateId: string,
  status: 'approved' | 'rejected',
): Promise<boolean> {
  const token = getPortalToken()
  if (DEMO_MODE || !token) return false

  const { data, error } = await callRpc('portal_update_estimate_status', {
    p_token: token,
    p_estimate_id: estimateId,
    p_status: status,
  })
  return !error && Boolean(data)
}

export async function portalSubmitJobRequest(
  title: string,
  description: string,
  priority: string,
): Promise<string | null> {
  const token = getPortalToken()
  if (DEMO_MODE || !token) return null

  const { data, error } = await callRpc('portal_submit_job_request', {
    p_token: token,
    p_title: title,
    p_description: description,
    p_priority: priority,
  })
  if (error || !data) return null
  return data
}

const REVIEW_KEY_PREFIX = 'handymanos_portal_review_'

export function getPortalReviewKey(customerId: string): string {
  return `${REVIEW_KEY_PREFIX}${customerId}`
}

export function hasPortalReview(customerId: string): boolean {
  return Boolean(localStorage.getItem(getPortalReviewKey(customerId)))
}

export async function portalSubmitReview(
  portal: PortalContext,
  rating: number,
  comment: string,
): Promise<boolean> {
  if (rating < 1 || rating > 5) return false

  const token = getPortalToken()
  if (DEMO_MODE || !token) {
    localStorage.setItem(
      getPortalReviewKey(portal.customerId),
      JSON.stringify({ rating, comment, created_at: new Date().toISOString() }),
    )
    return true
  }

  const { data, error } = await callRpc('portal_submit_review', {
    p_token: token,
    p_rating: rating,
    p_comment: comment || null,
  })
  if (!error && data) {
    localStorage.setItem(getPortalReviewKey(portal.customerId), '1')
    return true
  }

  return false
}
