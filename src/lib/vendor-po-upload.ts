/** Normalize PDF filenames for duplicate checks (case, spaces). */
export function normalizeVendorPoFileName(fileName: string): string {
  return fileName.trim().toLowerCase().replace(/\s+/g, ' ')
}

async function readFileBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') {
    try {
      return await file.arrayBuffer()
    } catch {
      // fall through to FileReader
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

export async function hashPdfFile(file: File): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle?.digest) {
    throw new Error('SHA-256 is not available in this browser context')
  }
  const buffer = await readFileBuffer(file)
  const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(buffer))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export {
  VendorPoDuplicateFileError,
  isVendorPoDuplicateFileError,
} from '@/lib/vendor-po-errors'
