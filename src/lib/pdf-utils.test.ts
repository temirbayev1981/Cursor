import { describe, it, expect } from 'vitest'
import { isPdfFile, prefersNoPdfWorker } from './pdf-utils'

describe('pdf-utils', () => {
  it('isPdfFile accepts application/pdf', () => {
    expect(isPdfFile(new File(['%PDF'], 'test.pdf', { type: 'application/pdf' }))).toBe(true)
  })

  it('isPdfFile accepts extension-only pdf', () => {
    expect(isPdfFile(new File(['%PDF'], 'VendorPO.pdf', { type: '' }))).toBe(true)
  })

  it('isPdfFile rejects non-pdf', () => {
    expect(isPdfFile(new File(['hello'], 'notes.txt', { type: 'text/plain' }))).toBe(false)
  })

  it('prefersNoPdfWorker is false in jsdom desktop tests', () => {
    expect(prefersNoPdfWorker()).toBe(false)
  })
})
