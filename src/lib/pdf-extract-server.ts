import { getExtractPdfEndpoint, getOpenAIEndpoint, hasSupabase, isE2eMockBackend } from '@/lib/env'
import { getSupabaseAuthHeaders } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/error-message'

const MAX_PDF_BYTES = 8 * 1024 * 1024

async function fileToBase64(file: File): Promise<string> {
  if (file.size === 0) {
    throw new Error('PDF file is empty — re-select the file on your device')
  }

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

function serverEndpoints(): { url: string; extractPdf?: boolean }[] {
  const endpoints: { url: string; extractPdf?: boolean }[] = []
  const openai = getOpenAIEndpoint()
  if (openai) endpoints.push({ url: openai, extractPdf: true })
  const dedicated = getExtractPdfEndpoint()
  if (dedicated && dedicated !== openai) endpoints.push({ url: dedicated })
  return endpoints
}

export function canExtractPdfOnServer(): boolean {
  return serverEndpoints().length > 0 && hasSupabase && !isE2eMockBackend
}

async function postPdfExtract(
  endpoint: string,
  pdfBase64: string,
  extractPdf?: boolean,
): Promise<string> {
  const headers = await getSupabaseAuthHeaders()
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(extractPdf ? { extractPdf: true, pdfBase64 } : { pdfBase64 }),
  })

  const json = await res.json().catch(() => ({})) as { text?: string; error?: string }
  if (!res.ok) {
    const detail = json.error ?? `HTTP ${res.status}`
    if (res.status === 401) throw new Error(`Unauthorized — sign in again (${detail})`)
    if (res.status === 404) throw new Error(`PDF extract function not deployed (${detail})`)
    throw new Error(detail)
  }

  const text = json.text?.trim() ?? ''
  if (!text) throw new Error('Server returned empty PDF text')
  return text
}

export async function extractTextFromPdfServer(file: File): Promise<string> {
  if (file.size > MAX_PDF_BYTES) {
    throw new Error(`PDF exceeds ${MAX_PDF_BYTES} byte limit`)
  }

  const pdfBase64 = await fileToBase64(file)
  const endpoints = serverEndpoints()
  if (endpoints.length === 0) {
    throw new Error('Server PDF extract endpoint not configured')
  }

  let lastError: unknown
  for (const { url, extractPdf } of endpoints) {
    try {
      return await postPdfExtract(url, pdfBase64, extractPdf)
    } catch (err) {
      lastError = err
      console.warn('PDF server extract attempt failed:', url, getErrorMessage(err))
    }
  }

  throw lastError instanceof Error ? lastError : new Error(getErrorMessage(lastError))
}

export function serverExtractErrorMessage(err: unknown): string {
  return getErrorMessage(err)
}
