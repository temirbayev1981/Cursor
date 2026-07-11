import { describe, it, expect } from 'vitest'
import { bundledWorkerSrc } from '@/lib/pdf-extract'

describe('pdf-extract worker URL', () => {
  it('bundledWorkerSrc returns root-relative path in SSR', () => {
    expect(bundledWorkerSrc()).toMatch(/pdf\.worker\.min\.mjs$/)
  })
})
