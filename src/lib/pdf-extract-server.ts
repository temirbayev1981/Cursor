import { getExtractPdfEndpoint, hasSupabase, isE2eMockBackend } from '@/lib/env'
import { getSupabaseAuthHeaders } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/error-message'

const MAX_PDF_BYTES = 8 * 1024 * 1024
const PROBE_KEY = 'handymanos_pdf_server_probe'
const PROBE_TTL_MS = 5 * 60 * 1000

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

export function canExtractPdfOnServer(): boolean {
  return Boolean(getExtractPdfEndpoint()) && hasSupabase && !isE2eMockBackend
}

function readProbeCache(): boolean | null {
  try {
    const raw = sessionStorage.getItem(PROBE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { ok?: boolean; at?: number }
    if (typeof parsed.ok !== 'boolean' || typeof parsed.at !== 'number') return null
    if (Date.now() - parsed.at > PROBE_TTL_MS) return null
    return parsed.ok
  } catch {
    return null
  }
}

function writeProbeCache(ok: boolean): void {
  try {
    sessionStorage.setItem(PROBE_KEY, JSON.stringify({ ok, at: Date.now() }))
  } catch {
    // ignore quota errors
  }
}

export async function isServerPdfExtractAvailable(): Promise<boolean> {
  const cached = readProbeCache()
  if (cached !== null) return cached

  const endpoint = getExtractPdfEndpoint()
  if (!endpoint) {
    writeProbeCache(false)
    return false
  }

  try {
    const headers = await getSupabaseAuthHeaders()
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ pdfBase64: 'AA==' }),
    })
    const available = res.status !== 404
    writeProbeCache(available)
    return available
  } catch {
    writeProbeCache(false)
    return false
  }
}

async function postPdfExtract(endpoint: string, pdfBase64: string): Promise<string> {
  const headers = await getSupabaseAuthHeaders()
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ pdfBase64 }),
  })

  const json = await res.json().catch(() => ({})) as {
    text?: string
    error?: string
    message?: string
    code?: string
  }
  if (!res.ok) {
    const detail = json.error ?? json.message ?? `HTTP ${res.status}`
    if (res.status === 404 || json.code === 'NOT_FOUND') {
      throw new Error(`PDF extract function not deployed (${detail})`)
    }
    if (res.status === 401) throw new Error(`Unauthorized — sign in again (${detail})`)
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

  const endpoint = getExtractPdfEndpoint()
  if (!endpoint) {
    throw new Error('Server PDF extract endpoint not configured')
  }

  const pdfBase64 = await fileToBase64(file)
  return postPdfExtract(endpoint, pdfBase64)
}

export function serverExtractErrorMessage(err: unknown): string {
  return getErrorMessage(err)
}
