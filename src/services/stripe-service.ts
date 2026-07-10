import { hasStripe, env, getStripeCheckoutEndpoint } from '@/lib/env'
import { getSupabaseAuthHeaders } from '@/lib/supabase'

type StripeInstance = {
  redirectToCheckout: (opts: { sessionId: string }) => Promise<{ error?: { message: string } }>
}

let stripePromise: Promise<StripeInstance | null> | null = null

async function loadStripe(): Promise<StripeInstance | null> {
  if (!hasStripe) return null
  if (!stripePromise) {
    stripePromise = (async () => {
      const { loadStripe } = await import('@stripe/stripe-js')
      return loadStripe(env.VITE_STRIPE_PUBLISHABLE_KEY!) as Promise<StripeInstance | null>
    })()
  }
  return stripePromise
}

export async function startStripeCheckout(params: {
  invoiceId: string
  invoiceNumber: string
  amount: number
  customerEmail?: string
}): Promise<'redirected' | 'demo' | 'error'> {
  const endpoint = getStripeCheckoutEndpoint()

  if (!hasStripe) return 'demo'

  if (!endpoint) {
    return 'demo'
  }

  try {
    const headers = await getSupabaseAuthHeaders()
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        invoice_id: params.invoiceId,
        invoice_number: params.invoiceNumber,
        amount_cents: Math.round(params.amount * 100),
        customer_email: params.customerEmail,
        success_url: `${window.location.origin}/invoices?paid=${params.invoiceId}`,
        cancel_url: `${window.location.origin}/invoices`,
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
