import { getExtractPdfEndpoint, hasSupabase, isE2eMockBackend } from '@/lib/env'
import { getSupabaseAuthHeaders, supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/error-message'
import { fetchWithTimeout } from '@/lib/with-timeout'

const MAX_PDF_BYTES = 8 * 1024 * 1024
const PROBE_KEY = 'handymanos_pdf_server_probe'
const PROBE_TTL_MS = 5 * 60 * 1000

async function readFileBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') {
    try {
      return await file.arrayBuffer()
    } catch {
      // iOS WebViews sometimes fail arrayBuffer(); fall back to FileReader.
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result)
      else reject(new Error('FileReader did not return ArrayBuffer'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed to read PDF'))
    reader.readAsArrayBuffer(file)
  })
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

async function fileToBase64ViaDataUrl(file: File): Promise<string> {
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

async function fileToBase64(file: File): Promise<string> {
  if (file.size === 0) {
    throw new Error('PDF file is empty — re-select the file on your device')
  }

  try {
    return await fileToBase64ViaDataUrl(file)
  } catch {
    const buffer = await readFileBuffer(file)
    return arrayBufferToBase64(buffer)
  }
}

export function canExtractPdfOnServer(): boolean {
  return Boolean(getExtractPdfEndpoint()) && hasSupabase && !isE2eMockBackend
}

export function clearServerPdfExtractProbeCache(): void {
  try {
    sessionStorage.removeItem(PROBE_KEY)
  } catch {
    // ignore
  }
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
    const res = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ pdfBase64: 'AA==' }),
      timeoutMs: 12_000,
    })
    const available = res.status !== 404
    writeProbeCache(available)
    return available
  } catch {
    writeProbeCache(false)
    return false
  }
}

async function postPdfExtract(
  endpoint: string,
  pdfBase64: string,
  options: { refreshAuth?: boolean } = {},
): Promise<string> {
  const headers = await getSupabaseAuthHeaders()
  const res = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ pdfBase64 }),
    timeoutMs: 90_000,
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
      clearServerPdfExtractProbeCache()
      writeProbeCache(false)
      throw new Error(`PDF extract function not deployed (${detail})`)
    }
    if (res.status === 401) {
      if (options.refreshAuth !== false && supabase) {
        await supabase.auth.refreshSession()
        return postPdfExtract(endpoint, pdfBase64, { refreshAuth: false })
      }
      throw new Error(`Unauthorized — sign in again (${detail})`)
    }
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
