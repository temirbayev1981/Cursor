import { getExtractPdfEndpoint, hasSupabase, isE2eMockBackend } from '@/lib/env'
import { getSupabaseAuthHeaders } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/error-message'

const MAX_PDF_BYTES = 8 * 1024 * 1024

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('FileReader did not return data URL'))
        return
      }
      const comma = reader.result.indexOf(',')
      resolve(comma >= 0 ? reader.result.slice(comma + 1) : reader.result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed to encode PDF'))
    reader.readAsDataURL(file)
  })
}

export function canExtractPdfOnServer(): boolean {
  return Boolean(getExtractPdfEndpoint()) && hasSupabase && !isE2eMockBackend
}

export async function extractTextFromPdfServer(file: File): Promise<string> {
  const endpoint = getExtractPdfEndpoint()
  if (!endpoint) throw new Error('Server PDF extract endpoint not configured')

  if (file.size > MAX_PDF_BYTES) {
    throw new Error(`PDF exceeds ${MAX_PDF_BYTES} byte limit`)
  }

  const pdfBase64 = await fileToBase64(file)
  const headers = await getSupabaseAuthHeaders()
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ pdfBase64 }),
  })

  const json = await res.json().catch(() => ({})) as { text?: string; error?: string }
  if (!res.ok) {
    throw new Error(json.error ?? `Server PDF extract failed (${res.status})`)
  }

  const text = json.text?.trim() ?? ''
  if (!text) throw new Error('Server returned empty PDF text')
  return text
}

export function serverExtractErrorMessage(err: unknown): string {
  return getErrorMessage(err)
}
