// Server-side PDF text extraction — reliable fallback for iOS Safari where client pdf.js fails.
// Deploy: supabase functions deploy extract-pdf-text

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import * as pdfjsLib from 'npm:pdfjs-dist@6.1.200/legacy/build/pdf.mjs'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { checkRateLimit, clientRateLimitKey, rateLimitResponse } from '../_shared/rate-limit.ts'

const MAX_BYTES = 8 * 1024 * 1024

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

    const binary = atob(pdfBase64)
    if (binary.length > MAX_BYTES) {
      return jsonResponse({ error: 'PDF too large' }, 413)
    }

    const data = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      data[i] = binary.charCodeAt(i)
    }

    pdfjsLib.GlobalWorkerOptions.workerPort = null
    pdfjsLib.GlobalWorkerOptions.workerSrc = ''

    const pdf = await pdfjsLib.getDocument({
      data,
      disableWorker: true,
      useSystemFonts: true,
      useWorkerFetch: false,
      disableFontFace: true,
      isEvalSupported: false,
    }).promise

    const pages: string[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
      pages.push(pageText)
    }

    return jsonResponse({ text: pages.join('\n\n').trim() })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return jsonResponse({ error: message }, 400)
  }
})
