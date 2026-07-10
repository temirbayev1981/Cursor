// Supabase Edge Function: Stripe Checkout Session
// Deploy: supabase functions deploy create-checkout-session
// Secrets: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { checkRateLimit, clientRateLimitKey, rateLimitResponse } from '../_shared/rate-limit.ts'

type InvoiceRow = {
  id: string
  company_id: string
  customer_id: string
  status: string
  total: number
  amount_paid: number
}

async function verifyPortalInvoice(
  portalToken: string,
  invoiceId: string,
): Promise<InvoiceRow | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return null

  const admin = createClient(supabaseUrl, serviceKey)
  const { data: portalRows } = await admin.rpc('validate_portal_token', { p_token: portalToken })
  if (!portalRows?.length) return null

  const portal = portalRows[0] as { customer_id: string; company_id: string }
  const { data: invoice } = await admin
    .from('invoices')
    .select('id, company_id, customer_id, status, total, amount_paid')
    .eq('id', invoiceId)
    .single()

  if (!invoice) return null
  const row = invoice as InvoiceRow
  if (row.company_id !== portal.company_id || row.customer_id !== portal.customer_id) return null
  return row
}

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return jsonResponse({ error: 'STRIPE_SECRET_KEY not configured' }, 500)
    }

    const body = await req.json()
    const {
      invoice_id,
      invoice_number,
      amount_cents,
      customer_email,
      success_url,
      cancel_url,
      portal_token,
    } = body

    if (!invoice_id || amount_cents == null) {
      return jsonResponse({ error: 'invoice_id and amount_cents required' }, 400)
    }

    const auth = await verifyAuth(req)
    const rateKey = auth
      ? `checkout:${clientRateLimitKey(req, auth.userId)}`
      : `checkout:portal:${req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'}`
    const rate = await checkRateLimit(rateKey, 10)
    if (!rate.ok) return rateLimitResponse(rate.retryAfter ?? 60)

    let invoice: InvoiceRow | null = null

    if (auth?.companyId) {
      const { data } = await auth.supabase
        .from('invoices')
        .select('id, company_id, customer_id, status, total, amount_paid')
        .eq('id', invoice_id)
        .single()

      if (!data || (data as InvoiceRow).company_id !== auth.companyId) {
        return jsonResponse({ error: 'Invoice not found or access denied' }, 403)
      }
      invoice = data as InvoiceRow
    } else if (portal_token) {
      invoice = await verifyPortalInvoice(portal_token, invoice_id)
      if (!invoice) {
        return jsonResponse({ error: 'Portal access denied for invoice' }, 403)
      }
    } else {
      return jsonResponse({ error: 'Authentication or portal token required' }, 401)
    }

    const dueCents = Math.round((invoice.total - invoice.amount_paid) * 100)
    if (dueCents <= 0) {
      return jsonResponse({ error: 'Invoice already paid' }, 400)
    }
    if (Math.abs(Number(amount_cents) - dueCents) > 1) {
      return jsonResponse({ error: 'Amount does not match invoice balance' }, 400)
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Invoice ${invoice_number ?? invoice_id}` },
          unit_amount: dueCents,
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
