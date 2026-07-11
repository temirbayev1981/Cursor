import { ocrImagesToText } from '@/lib/pdf-ocr'
import { hasOpenAI } from '@/lib/env'

type PdfJsModule = typeof import('pdfjs-dist')
type PdfDocument = Awaited<ReturnType<PdfJsModule['getDocument']>['promise']>

const PDFJS_VERSION = '6.1.200'
const OCR_MAX_PAGES = 2
const OCR_RENDER_SCALE = 1.5

let pdfjsReady: Promise<PdfJsModule> | null = null

function isMobileSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua)
}

function cdnAsset(path: string): string {
  return `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/${path}`
}

function resolveWorkerSrc(workerUrl: string): string {
  if (typeof window === 'undefined') return workerUrl
  try {
    return new URL(workerUrl, window.location.href).href
  } catch {
    return workerUrl
  }
}

async function configurePdfWorker(pdfjsLib: PdfJsModule): Promise<void> {
  // workerPort breaks on many FTP hosts + iOS Safari (.mjs MIME / module workers).
  // Let pdf.js load the worker from workerSrc only.
  pdfjsLib.GlobalWorkerOptions.workerPort = null

  const cdnWorker = cdnAsset('build/pdf.worker.min.mjs')
  if (isMobileSafari()) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = cdnWorker
    return
  }

  try {
    const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    pdfjsLib.GlobalWorkerOptions.workerSrc = resolveWorkerSrc(workerModule.default)
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = cdnWorker
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
  )
}

function pdfDocumentOptions(data: ArrayBuffer | Uint8Array) {
  return {
    data,
    useSystemFonts: true,
    useWorkerFetch: false,
    standardFontDataUrl: cdnAsset('standard_fonts/'),
    cMapUrl: cdnAsset('cmaps/'),
    cMapPacked: true,
  }
}

async function loadPdfDocument(pdfjsLib: PdfJsModule, buffer: ArrayBuffer): Promise<PdfDocument> {
  const attempts = [
    () => pdfjsLib.getDocument(pdfDocumentOptions(buffer)).promise,
    () => pdfjsLib.getDocument(pdfDocumentOptions(new Uint8Array(buffer))).promise,
  ]

  let lastError: unknown
  for (const attempt of attempts) {
    try {
      return await attempt()
    } catch (err) {
      lastError = err
    }
  }

  resetPdfjs()
  const reloaded = await getPdfjs()
  try {
    return await reloaded.getDocument(pdfDocumentOptions(new Uint8Array(buffer))).promise
  } catch (retryError) {
    const detail = lastError instanceof Error ? lastError.message : String(lastError)
    const retryDetail = retryError instanceof Error ? retryError.message : String(retryError)
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
  const buffer = await file.arrayBuffer()
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
    try {
      const text = await extractTextFromPdf(file)
      results.push({ fileName: file.name, text })
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      throw new Error(`${file.name}: ${detail}`)
    }
  }
  return results
}
