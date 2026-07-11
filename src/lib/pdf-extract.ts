import { ocrImagesToText } from '@/lib/pdf-ocr'
import { hasOpenAI } from '@/lib/env'
import { getErrorMessage } from '@/lib/error-message'

type PdfJsModule = typeof import('pdfjs-dist')
type PdfDocument = Awaited<ReturnType<PdfJsModule['getDocument']>['promise']>

const OCR_MAX_PAGES = 2
const OCR_RENDER_SCALE = 1.5

let pdfjsReady: Promise<PdfJsModule> | null = null

function normalizeBasePath(): string {
  const base = import.meta.env.BASE_URL || '/'
  return base.endsWith('/') ? base : `${base}/`
}

export function bundledWorkerSrc(): string {
  const workerPath = `${normalizeBasePath()}pdf.worker.min.mjs`
  if (typeof window === 'undefined') return workerPath
  return new URL(workerPath, window.location.origin).href
}

async function configurePdfWorker(pdfjsLib: PdfJsModule): Promise<void> {
  pdfjsLib.GlobalWorkerOptions.workerPort = null
  pdfjsLib.GlobalWorkerOptions.workerSrc = bundledWorkerSrc()
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

function resetPdfjs(): void {
  pdfjsReady = null
}

export function isPdfFile(file: File): boolean {
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return (
    type === 'application/pdf'
    || type === 'application/x-pdf'
    || name.endsWith('.pdf')
    || (type === 'application/octet-stream' && name.endsWith('.pdf'))
    || (!type && name.endsWith('.pdf'))
  )
}

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
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result)
        return
      }
      reject(new Error('FileReader did not return ArrayBuffer'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed to read PDF'))
    reader.readAsArrayBuffer(file)
  })
}

function pdfDocumentOptions(data: ArrayBuffer | Uint8Array, disableWorker = false) {
  return {
    data,
    useSystemFonts: true,
    useWorkerFetch: false,
    disableFontFace: true,
    disableWorker,
  }
}

async function loadPdfDocument(pdfjsLib: PdfJsModule, buffer: ArrayBuffer): Promise<PdfDocument> {
  const variants = [
    pdfDocumentOptions(new Uint8Array(buffer), false),
    pdfDocumentOptions(buffer, false),
    pdfDocumentOptions(new Uint8Array(buffer), true),
    pdfDocumentOptions(buffer, true),
  ]

  let lastError: unknown
  for (const options of variants) {
    try {
      return await pdfjsLib.getDocument(options).promise
    } catch (err) {
      lastError = err
    }
  }

  resetPdfjs()
  const reloaded = await getPdfjs()
  try {
    return await reloaded.getDocument(pdfDocumentOptions(new Uint8Array(buffer), true)).promise
  } catch (retryError) {
    const detail = getErrorMessage(lastError)
    const retryDetail = getErrorMessage(retryError)
    throw new Error(`PDF extract failed: ${detail} (retry: ${retryDetail})`)
  }
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
  const buffer = await readFileBuffer(file)
  const pdf = await loadPdfDocument(pdfjsLib, buffer)

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

export async function tryExtractTextFromPdf(
  file: File,
): Promise<{ fileName: string; text: string; error?: string }> {
  try {
    const text = await extractTextFromPdf(file)
    return { fileName: file.name, text }
  } catch (err) {
    return { fileName: file.name, text: '', error: getErrorMessage(err) }
  }
}
