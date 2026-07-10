import { describe, it, expect } from 'vitest'
import { fileToBase64, base64ToFile } from './file-utils'

describe('file-utils', () => {
  it('round-trips file content through base64', async () => {
    const original = new File(['hello world'], 'test.txt', { type: 'text/plain' })
    const base64 = await fileToBase64(original)
    const restored = base64ToFile(base64, 'test.txt', 'text/plain')

    expect(restored.name).toBe('test.txt')
    expect(restored.type).toBe('text/plain')
    expect(await restored.text()).toBe('hello world')
  })
})
