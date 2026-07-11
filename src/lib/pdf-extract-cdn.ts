const CDN_SOURCES = [
  {
    base: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174',
    pdf: 'pdf.min.js',
    worker: 'pdf.worker.min.js',
    scriptId: 'handymanos-pdfjs-cdnjs',
  },
  {
    base: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build',
    pdf: 'pdf.min.js',
    worker: 'pdf.worker.min.js',
    scriptId: 'handymanos-pdfjs-jsdelivr',
  },
] as const

type CdnPdfJs = {
  getDocument: (opts: Record<string, unknown>) => { promise: Promise<CdnPdfDocument> }
  GlobalWorkerOptions: { workerSrc: string; workerPort: null }
}

type CdnPdfDocument = {
  numPages: number
  getPage: (n: number) => Promise<{
    getTextContent: () => Promise<{ items: { str?: string }[] }>
  }>
}

declare global {
  interface Window {
    pdfjsLib?: CdnPdfJs
  }
}

let cdnLoadPromise: Promise<CdnPdfJs> | null = null

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id)
    if (existing) {
      if (existing.getAttribute('data-loaded') === 'true') {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)), { once: true })
      return
    }
    const script = document.createElement('script')
    script.id = id
    script.src = src
    script.async = true
    script.onload = () => {
      script.setAttribute('data-loaded', 'true')
      resolve()
    }
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

async function loadCdnPdfJsFromSource(source: (typeof CDN_SOURCES)[number]): Promise<CdnPdfJs> {
  delete window.pdfjsLib
  await loadScript(`${source.base}/${source.pdf}`, source.scriptId)
  const lib = window.pdfjsLib
  if (!lib?.getDocument) throw new Error(`CDN pdf.js failed to initialize (${source.scriptId})`)
  lib.GlobalWorkerOptions.workerPort = null
  lib.GlobalWorkerOptions.workerSrc = `${source.base}/${source.worker}`
  return lib
}

export async function getCdnPdfJs(): Promise<CdnPdfJs> {
  if (!cdnLoadPromise) {
    cdnLoadPromise = (async () => {
      let lastError: unknown
      for (const source of CDN_SOURCES) {
        try {
          return await loadCdnPdfJsFromSource(source)
        } catch (err) {
          lastError = err
          document.getElementById(source.scriptId)?.remove()
        }
      }
      throw lastError instanceof Error ? lastError : new Error('All CDN pdf.js sources failed')
    })()
  }
  return cdnLoadPromise
}

async function readFileBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') {
    try {
      return await file.arrayBuffer()
    } catch {
      // fall through
    }
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result)
      else reject(new Error('FileReader did not return ArrayBuffer'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
    reader.readAsArrayBuffer(file)
  })
}

export async function extractTextFromPdfCdn(file: File): Promise<string> {
  const pdfjs = await getCdnPdfJs()
  const buffer = await readFileBuffer(file)

  const variants = [
    { data: new Uint8Array(buffer), disableWorker: true },
    { data: buffer, disableWorker: true },
  ]

  let pdf: CdnPdfDocument | null = null
  let lastError: unknown
  for (const options of variants) {
    try {
      pdf = await pdfjs.getDocument({
        ...options,
        useSystemFonts: true,
        disableFontFace: true,
        useWorkerFetch: false,
        isEvalSupported: false,
      }).promise
      break
    } catch (err) {
      lastError = err
    }
  }
  if (!pdf) {
    throw new Error(`CDN PDF load failed: ${lastError instanceof Error ? lastError.message : 'unknown error'}`)
  }

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => item.str ?? '').join(' '))
  }
  const text = pages.join('\n\n').trim()
  if (!text) throw new Error('CDN PDF extract returned empty text')
  return text
}

export function resetCdnPdfJsForTests(): void {
  cdnLoadPromise = null
  for (const source of CDN_SOURCES) {
    document.getElementById(source.scriptId)?.remove()
  }
  delete window.pdfjsLib
}
