// Server-side PDF text extraction via OpenAI (lightweight — no pdf.js bundle).
// Deploy: supabase functions deploy extract-pdf-text

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { checkRateLimit, clientRateLimitKey, rateLimitResponse } from '../_shared/rate-limit.ts'
import { extractVendorPoPdfText } from '../_shared/pdf-extract.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const auth = await verifyAuth(req)
    if (!auth) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const rate = await checkRateLimit(`pdf-extract:${clientRateLimitKey(req, auth.userId)}`, 30)
    if (!rate.ok) return rateLimitResponse(rate.retryAfter ?? 60)

    const { pdfBase64 } = await req.json() as { pdfBase64?: string }
    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return jsonResponse({ error: 'pdfBase64 required' }, 400)
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      return jsonResponse({ error: 'OPENAI_API_KEY not configured' }, 500)
    }

    const text = await extractVendorPoPdfText(pdfBase64, openaiKey)
    return jsonResponse({ text })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return jsonResponse({ error: message }, 400)
  }
})
