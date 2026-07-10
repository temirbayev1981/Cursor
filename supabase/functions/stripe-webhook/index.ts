// Stripe Webhook — marks invoice paid after checkout.session.completed
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing configuration' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })
  const supabase = createClient(supabaseUrl, serviceKey)
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response(JSON.stringify({ error: 'No signature' }), { status: 400, headers: corsHeaders })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: corsHeaders })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.metadata?.type === 'saas_subscription' && session.metadata.company_id) {
      await supabase.from('companies').update({
        subscription_plan: session.metadata.subscription_plan,
        stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      }).eq('id', session.metadata.company_id)
    }

    const invoiceId = session.metadata?.invoice_id
    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id

    if (invoiceId) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, total, amount_paid, company_id')
        .eq('id', invoiceId)
        .single()

      if (invoice) {
        const amount = Number(invoice.total) - Number(invoice.amount_paid ?? 0)
        await supabase.from('payments').insert({
          invoice_id: invoiceId,
          amount: amount > 0 ? amount : invoice.total,
          method: 'stripe',
          stripe_payment_id: paymentIntentId ?? session.id,
        })
        await supabase.from('invoices').update({
          status: 'paid',
          amount_paid: invoice.total,
          paid_date: new Date().toISOString(),
          stripe_invoice_id: session.id,
        }).eq('id', invoiceId)

        await supabase.from('audit_logs').insert({
          id: crypto.randomUUID(),
          company_id: invoice.company_id,
          user_id: 'stripe',
          action: 'invoice.payment',
          entity_type: 'invoice',
          entity_id: invoiceId,
        })
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
