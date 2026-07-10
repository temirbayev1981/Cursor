// Twilio SMS relay (requires authenticated user)
// Deploy: supabase functions deploy send-sms
// Secrets: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, SUPABASE_URL, SUPABASE_ANON_KEY

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { checkRateLimit, clientRateLimitKey, rateLimitResponse } from '../_shared/rate-limit.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const auth = await verifyAuth(req)
    if (!auth) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const rate = await checkRateLimit(`sms:${clientRateLimitKey(req, auth.userId)}`, 15)
    if (!rate.ok) return rateLimitResponse(rate.retryAfter ?? 60)

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!accountSid || !authToken || !fromNumber) {
      return jsonResponse({ error: 'Twilio not configured' }, 500)
    }

    const { to, body } = await req.json() as { to?: string; body?: string }
    if (!to || !body) {
      return jsonResponse({ error: 'to and body required' }, 400)
    }

    const credentials = btoa(`${accountSid}:${authToken}`)
    const params = new URLSearchParams({ To: to, From: fromNumber, Body: body })

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      return jsonResponse({ error: errText }, res.status)
    }

    const data = await res.json()
    return jsonResponse({ ok: true, sid: data.sid })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return jsonResponse({ error: message }, 400)
  }
})
