const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174'
const SCRIPT_ID = 'handymanos-pdfjs-cdn'

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
    if (document.getElementById(id)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.id = id
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

export async function getCdnPdfJs(): Promise<CdnPdfJs> {
  if (!cdnLoadPromise) {
    cdnLoadPromise = (async () => {
      await loadScript(`${PDFJS_CDN}/pdf.min.js`, SCRIPT_ID)
      const lib = window.pdfjsLib
      if (!lib?.getDocument) throw new Error('CDN pdf.js failed to initialize')
      lib.GlobalWorkerOptions.workerPort = null
      lib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`
      return lib
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
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
    useSystemFonts: true,
    disableFontFace: true,
  }).promise

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
  document.getElementById(SCRIPT_ID)?.remove()
  delete window.pdfjsLib
}
