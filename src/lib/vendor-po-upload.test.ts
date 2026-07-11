import { describe, it, expect } from 'vitest'
import { hashPdfFile, normalizeVendorPoFileName } from '@/lib/vendor-po-upload'

describe('vendor-po-upload', () => {
  it('normalizeVendorPoFileName lowercases and collapses spaces', () => {
    expect(normalizeVendorPoFileName(' VendorPO-210071-01.PDF ')).toBe('vendorpo-210071-01.pdf')
    expect(normalizeVendorPoFileName('VendorPO-210150-01  3.pdf')).toBe('vendorpo-210150-01 3.pdf')
  })

  it('hashPdfFile returns stable sha256 hex', async () => {
    const file = new File(['%PDF-1.4 same bytes'], 'a.pdf', { type: 'application/pdf' })
    const hash1 = await hashPdfFile(file)
    const hash2 = await hashPdfFile(file)
    expect(hash1).toHaveLength(64)
    expect(hash1).toBe(hash2)
  })
})
