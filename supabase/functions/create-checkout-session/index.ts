// Supabase Edge Function: Stripe Checkout Session
// Deploy: supabase functions deploy create-checkout-session
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (optional)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { invoice_id, invoice_number, amount_cents, customer_email, success_url, cancel_url } = await req.json()

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Invoice ${invoice_number}` },
          unit_amount: amount_cents,
        },
        quantity: 1,
      }],
      metadata: { invoice_id, invoice_number },
      success_url: success_url ?? `${req.headers.get('origin')}/invoices?paid=${invoice_id}`,
      cancel_url: cancel_url ?? `${req.headers.get('origin')}/invoices`,
    })

    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
