import type { Estimate, Invoice, Job } from '@/types'
import type { CustomerNotificationPreferences } from '@/lib/customer-notification-prefs'
import { callRpc } from '@/lib/supabase-rpc'
import { getPortalToken } from '@/services/portal-service'
import type { PortalContext } from '@/types/portal'

/** Portal mutations use server RPCs only — no local entity-store bypass. */
export const PORTAL_RPC_ENFORCED = true as const

async function fetchPortalRows<T extends Estimate | Invoice | Job>(
  rpc: 'get_portal_estimates' | 'get_portal_invoices' | 'get_portal_jobs',
): Promise<T[]> {
  const token = getPortalToken()
  if (!token) return []

  const { data, error } = await callRpc(rpc, { p_token: token })
  if (error || !data) return []

  return data as T[]
}

export async function fetchPortalEstimates(_portal: PortalContext): Promise<Estimate[]> {
  return fetchPortalRows<Estimate>('get_portal_estimates')
}

export async function fetchPortalInvoices(_portal: PortalContext): Promise<Invoice[]> {
  return fetchPortalRows<Invoice>('get_portal_invoices')
}

export async function fetchPortalJobs(_portal: PortalContext): Promise<Job[]> {
  return fetchPortalRows<Job>('get_portal_jobs')
}

export async function portalApproveEstimate(
  estimateId: string,
  status: 'approved' | 'rejected',
): Promise<boolean> {
  const token = getPortalToken()
  if (!token) return false

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
  if (!token) return null

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
  if (!token) return false

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

export async function portalGetNotificationPreferences(): Promise<CustomerNotificationPreferences | null> {
  const token = getPortalToken()
  if (!token) return null

  const { data, error } = await callRpc('portal_get_notification_preferences', { p_token: token })
  if (error || !data) return null

  const prefs = data as { email?: boolean; sms?: boolean }
  return {
    email: prefs.email ?? true,
    sms: prefs.sms ?? false,
  }
}

export async function portalUpdateNotificationPreferences(
  prefs: CustomerNotificationPreferences,
): Promise<boolean> {
  const token = getPortalToken()
  if (!token) return false

  const { data, error } = await callRpc('portal_update_notification_preferences', {
    p_token: token,
    p_email: prefs.email,
    p_sms: prefs.sms,
  })
  return !error && Boolean(data)
}
