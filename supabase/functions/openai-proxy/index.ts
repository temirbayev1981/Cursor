// OpenAI API proxy — keeps API key server-side
// Deploy: supabase functions deploy openai-proxy
// Secrets: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY

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

    const rate = await checkRateLimit(`openai:${clientRateLimitKey(req, auth.userId)}`, 20)
    if (!rate.ok) return rateLimitResponse(rate.retryAfter ?? 60)

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      return jsonResponse({ error: 'OPENAI_API_KEY not configured' }, 500)
    }

    const { system, user, model = 'gpt-4o-mini', temperature = 0.3 } = await req.json() as {
      system?: string
      user?: string
      model?: string
      temperature?: number
    }

    if (!system || !user) {
      return jsonResponse({ error: 'system and user required' }, 400)
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return jsonResponse({ error: errText }, res.status)
    }

    const json = await res.json() as { choices?: { message?: { content?: string } }[] }
    return jsonResponse({ content: json.choices?.[0]?.message?.content ?? null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return jsonResponse({ error: message }, 400)
  }
})
