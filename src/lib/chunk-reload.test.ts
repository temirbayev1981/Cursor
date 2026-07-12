import { describe, it, expect } from 'vitest'
import { isChunkLoadError } from './chunk-reload'

describe('chunk-reload', () => {
  it('detects vite chunk load failures', () => {
    expect(isChunkLoadError('Failed to fetch dynamically imported module: /assets/jobs-abc.js')).toBe(true)
    expect(isChunkLoadError('error loading dynamically imported module')).toBe(true)
  })

  it('ignores unrelated errors', () => {
    expect(isChunkLoadError('Network request failed')).toBe(false)
    expect(isChunkLoadError('Unauthorized — sign in')).toBe(false)
  })
})
