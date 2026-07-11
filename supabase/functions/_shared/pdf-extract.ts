const DEFAULT_MAX_BYTES = 8 * 1024 * 1024

const VENDOR_PO_OCR_SYSTEM = `You extract plain text from a Vendor PO (work order) PDF.
Return ONLY the raw text visible in the document, preserving line breaks where possible.
Include: VENDOR PO #, Client PO #, vendor PO number (format like 207872-02), Priority, Order Type, NTE, SERVICE LOCATION, SERVICE DESCRIPTION, SPECIAL INSTRUCTIONS, addresses, phone numbers.
Do not summarize or add JSON.`

export function assertPdfBase64Size(pdfBase64: string, maxBytes = DEFAULT_MAX_BYTES): void {
  let binary: string
  try {
    binary = atob(pdfBase64)
  } catch {
    throw new Error('Invalid PDF encoding')
  }
  if (binary.length > maxBytes) {
    throw new Error('PDF too large')
  }
  if (binary.length < 4 || !binary.startsWith('%PDF')) {
    throw new Error('Invalid PDF file')
  }
}

export async function extractTextFromPdfWithOpenAI(
  pdfBase64: string,
  openaiKey: string,
  model = 'gpt-4o-mini',
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: VENDOR_PO_OCR_SYSTEM },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all text from this Vendor PO PDF.' },
            {
              type: 'file',
              file: {
                filename: 'vendor-po.pdf',
                file_data: `data:application/pdf;base64,${pdfBase64}`,
              },
            },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 4096,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenAI PDF extract failed: ${errText}`)
  }

  const json = await res.json() as { choices?: { message?: { content?: string } }[] }
  const text = json.choices?.[0]?.message?.content?.trim() ?? ''
  if (!text) throw new Error('OpenAI returned empty PDF text')
  return text
}

export async function extractVendorPoPdfText(
  pdfBase64: string,
  openaiKey: string,
): Promise<string> {
  assertPdfBase64Size(pdfBase64)
  try {
    return await extractTextFromPdfWithOpenAI(pdfBase64, openaiKey, 'gpt-4o-mini')
  } catch (miniErr) {
    const detail = miniErr instanceof Error ? miniErr.message : String(miniErr)
    if (/invalid pdf|invalid pdf encoding|pdf too large/i.test(detail)) {
      throw miniErr
    }
    return extractTextFromPdfWithOpenAI(pdfBase64, openaiKey, 'gpt-4o')
  }
}
