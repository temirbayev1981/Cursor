import * as pdfjsLib from 'npm:pdfjs-dist@6.1.200/legacy/build/pdf.mjs'

const DEFAULT_MAX_BYTES = 8 * 1024 * 1024

export function decodePdfBase64(pdfBase64: string, maxBytes = DEFAULT_MAX_BYTES): Uint8Array {
  const binary = atob(pdfBase64)
  if (binary.length > maxBytes) {
    throw new Error('PDF too large')
  }
  const data = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    data[i] = binary.charCodeAt(i)
  }
  return data
}

export async function extractTextFromPdfBytes(data: Uint8Array): Promise<string> {
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

  return pages.join('\n\n').trim()
}

export async function extractTextFromPdfBase64(pdfBase64: string): Promise<string> {
  const data = decodePdfBase64(pdfBase64)
  return extractTextFromPdfBytes(data)
}

const VENDOR_PO_OCR_SYSTEM = `You extract plain text from a Vendor PO (work order) PDF.
Return ONLY the raw text visible in the document, preserving line breaks where possible.
Include: VENDOR PO #, Client PO #, vendor PO number (format like 207872-02), Priority, Order Type, NTE, SERVICE LOCATION, SERVICE DESCRIPTION, SPECIAL INSTRUCTIONS, addresses, phone numbers.
Do not summarize or add JSON.`

export async function extractTextFromPdfWithOpenAI(
  pdfBase64: string,
  openaiKey: string,
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
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
    throw new Error(`OpenAI PDF OCR failed: ${errText}`)
  }

  const json = await res.json() as { choices?: { message?: { content?: string } }[] }
  const text = json.choices?.[0]?.message?.content?.trim() ?? ''
  if (!text) throw new Error('OpenAI returned empty PDF text')
  return text
}

export async function extractVendorPoPdfText(
  pdfBase64: string,
  openaiKey?: string | null,
): Promise<string> {
  let text = ''
  try {
    text = await extractTextFromPdfBase64(pdfBase64)
  } catch {
    text = ''
  }

  if (text.length >= 40 || !openaiKey) {
    if (!text) throw new Error('PDF extract failed')
    return text
  }

  return extractTextFromPdfWithOpenAI(pdfBase64, openaiKey)
}
