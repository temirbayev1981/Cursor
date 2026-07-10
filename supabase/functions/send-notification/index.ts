// Email notifications via Resend (requires authenticated user)
// Deploy: supabase functions deploy send-notification
// Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL, SUPABASE_URL, SUPABASE_ANON_KEY

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const auth = await verifyAuth(req)
    if (!auth) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const apiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'HandymanOS <onboarding@resend.dev>'

    if (!apiKey) {
      return jsonResponse({ error: 'RESEND_API_KEY not configured' }, 500)
    }

    const { to, subject, body, channel } = await req.json() as {
      to?: string
      subject?: string
      body?: string
      channel?: string
    }

    if (!to || !body) {
      return jsonResponse({ error: 'to and body required' }, 400)
    }

    if (channel && channel !== 'email') {
      return jsonResponse({ error: 'Only email channel supported here' }, 400)
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: subject ?? 'HandymanOS Notification',
        html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return jsonResponse({ error: errText }, res.status)
    }

    const data = await res.json()
    return jsonResponse({ ok: true, id: data.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return jsonResponse({ error: message }, 400)
  }
})
