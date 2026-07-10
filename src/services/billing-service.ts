import type { Company, SubscriptionPlan } from '@/types'
import { hasStripe, getStripeSubscriptionEndpoint } from '@/lib/env'
import { getSupabaseAuthHeaders, supabase, DEMO_MODE } from '@/lib/supabase'
import { getStoredCompany } from '@/services/onboarding-service'

type StripeInstance = {
  redirectToCheckout: (opts: { sessionId: string }) => Promise<{ error?: { message: string } }>
}

let stripePromise: Promise<StripeInstance | null> | null = null

async function loadStripe(): Promise<StripeInstance | null> {
  if (!hasStripe) return null
  if (!stripePromise) {
    stripePromise = (async () => {
      const { loadStripe } = await import('@stripe/stripe-js')
      const { env } = await import('@/lib/env')
      return loadStripe(env.VITE_STRIPE_PUBLISHABLE_KEY!) as Promise<StripeInstance | null>
    })()
  }
  return stripePromise
}

export async function updateCompanySubscription(
  companyId: string,
  plan: SubscriptionPlan
): Promise<Company> {
  const stored = getStoredCompany()
  const base = stored?.id === companyId ? stored : null
  const updated: Company = {
    ...(base ?? {
      id: companyId,
      name: 'My Company',
      email: '',
      phone: '',
      address: '',
      settings: {},
      created_at: new Date().toISOString(),
    }),
    subscription_plan: plan,
  }

  localStorage.setItem('handymanos_company', JSON.stringify(updated))

  if (!DEMO_MODE && supabase) {
    await supabase
      .from('companies')
      .update({ subscription_plan: plan } as never)
      .eq('id', companyId)
  }

  return updated
}

export async function startSubscriptionCheckout(
  plan: SubscriptionPlan,
  companyId: string
): Promise<'redirected' | 'demo' | 'error'> {
  const endpoint = getStripeSubscriptionEndpoint()

  if (!hasStripe || !endpoint) {
    await updateCompanySubscription(companyId, plan)
    return 'demo'
  }

  try {
    const headers = await getSupabaseAuthHeaders()
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        plan,
        success_url: `${window.location.origin}/settings?subscription=${plan}`,
        cancel_url: `${window.location.origin}/settings`,
      }),
    })

    if (!res.ok) return 'error'

    const { sessionId } = await res.json() as { sessionId?: string }
    if (!sessionId) return 'error'

    const stripe = await loadStripe()
    if (!stripe) return 'error'

    const { error } = await stripe.redirectToCheckout({ sessionId })
    if (error) return 'error'
    return 'redirected'
  } catch {
    return 'error'
  }
}

export const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  starter: 49,
  professional: 99,
  enterprise: 199,
}
