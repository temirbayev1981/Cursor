import { hasOpenAI, getOpenAIEndpoint, isE2eMockBackend } from '@/lib/env'
import { getSupabaseAuthHeaders } from '@/lib/supabase'

const VENDOR_PO_OCR_SYSTEM = `You extract plain text from a Vendor PO (work order) PDF page image.
Return ONLY the raw text visible in the document, preserving line breaks where possible.
Include: VENDOR PO #, Client PO #, vendor PO number (format like 207872-02), Priority, Order Type, NTE, SERVICE LOCATION, SERVICE DESCRIPTION, SPECIAL INSTRUCTIONS, addresses, phone numbers.
Do not summarize or add JSON.`

const E2E_MOCK_OCR_TEXT = `VENDOR PO # Service Date
Client PO # 350531955
207872-02
Priority P30
Order Type REPLACE
SERVICE DESCRIPTION
BUILDING INTERIOR / BUILDING REPAIR / CEILING TILE / REPLACE
SPECIAL INSTRUCTIONS
TECH MUST CALL FROM SITE`

export async function ocrImagesToText(imageDataUrls: string[]): Promise<string | null> {
  if (imageDataUrls.length === 0) return null

  if (isE2eMockBackend && hasOpenAI) {
    return E2E_MOCK_OCR_TEXT
  }

  const proxyEndpoint = getOpenAIEndpoint()
  if (!proxyEndpoint) return null

  try {
    const headers = await getSupabaseAuthHeaders()
    const res = await fetch(proxyEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        system: VENDOR_PO_OCR_SYSTEM,
        user: 'Extract all text from this Vendor PO document page.',
        images: imageDataUrls.slice(0, 2),
        model: 'gpt-4o-mini',
        temperature: 0,
      }),
    })
    if (!res.ok) return null
    const json = await res.json() as { content?: string | null }
    return json.content?.trim() ?? null
  } catch {
    return null
  }
}
