// Stripe Subscription Checkout for SaaS plans
// Deploy: supabase functions deploy create-subscription-checkout
// Secrets: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_ANON_KEY

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'

const PLAN_PRICES: Record<string, number> = {
  starter: 4900,
  professional: 9900,
  enterprise: 19900,
}

const PLAN_NAMES: Record<string, string> = {
  starter: 'HandymanOS Starter',
  professional: 'HandymanOS Professional',
  enterprise: 'HandymanOS Enterprise',
}

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const auth = await verifyAuth(req)
    if (!auth?.companyId) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return jsonResponse({ error: 'STRIPE_SECRET_KEY not configured' }, 500)
    }

    const { plan, success_url, cancel_url } = await req.json() as {
      plan?: string
      success_url?: string
      cancel_url?: string
    }

    if (!plan || !PLAN_PRICES[plan]) {
      return jsonResponse({ error: 'Valid plan required: starter, professional, enterprise' }, 400)
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: PLAN_NAMES[plan] },
          unit_amount: PLAN_PRICES[plan],
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      metadata: {
        type: 'saas_subscription',
        company_id: auth.companyId,
        subscription_plan: plan,
      },
      success_url: success_url ?? `${req.headers.get('origin')}/settings?subscription=${plan}`,
      cancel_url: cancel_url ?? `${req.headers.get('origin')}/settings?tab=billing`,
    })

    return jsonResponse({ sessionId: session.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return jsonResponse({ error: message }, 400)
  }
})
