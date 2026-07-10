// Supabase Edge Function: Stripe Checkout Session
// Deploy: supabase functions deploy create-checkout-session
// Secrets: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_ANON_KEY

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return jsonResponse({ error: 'STRIPE_SECRET_KEY not configured' }, 500)
    }

    const { invoice_id, invoice_number, amount_cents, customer_email, success_url, cancel_url } = await req.json()

    if (!invoice_id || !amount_cents) {
      return jsonResponse({ error: 'invoice_id and amount_cents required' }, 400)
    }

    const auth = await verifyAuth(req)

    if (auth?.companyId) {
      const { data: invoice } = await auth.supabase
        .from('invoices')
        .select('id, company_id, status')
        .eq('id', invoice_id)
        .single()

      if (!invoice || (invoice as { company_id: string }).company_id !== auth.companyId) {
        return jsonResponse({ error: 'Invoice not found or access denied' }, 403)
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Invoice ${invoice_number ?? invoice_id}` },
          unit_amount: amount_cents,
        },
        quantity: 1,
      }],
      metadata: { invoice_id, invoice_number: invoice_number ?? '' },
      success_url: success_url ?? `${req.headers.get('origin')}/invoices?paid=${invoice_id}`,
      cancel_url: cancel_url ?? `${req.headers.get('origin')}/invoices`,
    })

    return jsonResponse({ sessionId: session.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return jsonResponse({ error: message }, 400)
  }
})
