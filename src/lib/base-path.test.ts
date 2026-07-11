import { describe, it, expect } from 'vitest'
import { publicAsset } from '@/lib/base-path'

describe('base-path', () => {
  it('publicAsset keeps root paths unchanged', () => {
    expect(publicAsset('sw.js')).toBe('/sw.js')
    expect(publicAsset('/manifest.json')).toBe('/manifest.json')
  })
})
