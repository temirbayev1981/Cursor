/** iOS/iPadOS Safari and other touch browsers cannot reliably run pdf.js module workers. */
export function prefersNoPdfWorker(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return true
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true
  return false
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
