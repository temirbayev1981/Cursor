import { describe, it, expect, vi } from 'vitest'

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: '',
    workerPort: null,
  },
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({ numPages: 0 }),
  })),
}))

import { bundledWorkerSrc, prefersNoPdfWorker, warmUpPdfJs } from '@/lib/pdf-extract'

describe('pdf-extract worker URL', () => {
  it('bundledWorkerSrc returns root-relative path in SSR', () => {
    expect(bundledWorkerSrc()).toMatch(/pdf\.worker\.min\.mjs$/)
  })

  it('prefersNoPdfWorker is false in jsdom desktop tests', () => {
    expect(prefersNoPdfWorker()).toBe(false)
  })

  it('warmUpPdfJs configures pdf.js without throwing', () => {
    expect(() => warmUpPdfJs()).not.toThrow()
  })
})
