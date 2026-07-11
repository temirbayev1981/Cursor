import { ocrImagesToText } from '@/lib/pdf-ocr'
import { hasOpenAI } from '@/lib/env'

type PdfJsModule = typeof import('pdfjs-dist')
type PdfDocument = Awaited<ReturnType<PdfJsModule['getDocument']>['promise']>

const PDFJS_VERSION = '6.1.200'
const OCR_MAX_PAGES = 2
const OCR_RENDER_SCALE = 1.5

let pdfjsReady: Promise<PdfJsModule> | null = null

function resolveWorkerSrc(workerUrl: string): string {
  if (typeof window === 'undefined') return workerUrl
  try {
    return new URL(workerUrl, window.location.href).href
  } catch {
    return workerUrl
  }
}

async function configurePdfWorker(pdfjsLib: PdfJsModule): Promise<void> {
  if (pdfjsLib.GlobalWorkerOptions.workerPort) return

  let workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`

  try {
    const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    workerSrc = resolveWorkerSrc(workerModule.default)
  } catch {
    // Fall back to CDN worker URL below.
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

  if (typeof Worker !== 'undefined') {
    try {
      pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(workerSrc, { type: 'module' })
      return
    } catch {
      try {
        pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(workerSrc)
        return
      } catch {
        // pdf.js will use its fake-worker fallback with workerSrc.
      }
    }
  }
}

async function getPdfjs(): Promise<PdfJsModule> {
  if (!pdfjsReady) {
    pdfjsReady = (async () => {
      const pdfjsLib = await import('pdfjs-dist')
      await configurePdfWorker(pdfjsLib)
      return pdfjsLib
    })()
  }
  return pdfjsReady
}

export function isPdfFile(file: File): boolean {
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return (
    type === 'application/pdf'
    || type === 'application/x-pdf'
    || name.endsWith('.pdf')
    || (type === 'application/octet-stream' && name.endsWith('.pdf'))
  )
}

async function renderPageToDataUrl(pdf: PdfDocument, pageNumber: number): Promise<string> {
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale: OCR_RENDER_SCALE })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2d context unavailable')
  await page.render({ canvasContext: context, viewport, canvas }).promise
  return canvas.toDataURL('image/jpeg', 0.85)
}

async function ocrPdfPages(pdf: PdfDocument): Promise<string> {
  const images: string[] = []
  const pageCount = Math.min(pdf.numPages, OCR_MAX_PAGES)
  for (let i = 1; i <= pageCount; i++) {
    images.push(await renderPageToDataUrl(pdf, i))
  }
  const text = await ocrImagesToText(images)
  if (!text) throw new Error('PDF OCR failed — configure OpenAI proxy')
  return text
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await getPdfjs()
  const buffer = await file.arrayBuffer()
  let pdf

  try {
    pdf = await pdfjsLib.getDocument({ data: buffer, useSystemFonts: true }).promise
  } catch (primaryError) {
    try {
      pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        useSystemFonts: true,
        useWorkerFetch: false,
      }).promise
    } catch {
      const detail = primaryError instanceof Error ? primaryError.message : String(primaryError)
      throw new Error(`PDF extract failed: ${detail}`)
    }
  }

  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    pages.push(pageText)
  }

  const text = pages.join('\n\n').trim()
  if (text.length >= 40) return text

  if (!hasOpenAI) return text

  try {
    const ocrText = await ocrPdfPages(pdf)
    return ocrText.trim() || text
  } catch {
    return text
  }
}

export async function extractTextFromPdfFiles(files: File[]): Promise<{ fileName: string; text: string }[]> {
  const results: { fileName: string; text: string }[] = []
  for (const file of files) {
    const text = await extractTextFromPdf(file)
    results.push({ fileName: file.name, text })
  }
  return results
}
