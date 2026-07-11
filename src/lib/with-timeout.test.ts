import { describe, it, expect, vi } from 'vitest'
import { withTimeout, TimeoutError } from '@/lib/with-timeout'

describe('withTimeout', () => {
  it('resolves when promise completes in time', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 1000, 'test')).resolves.toBe('ok')
  })

  it('rejects when promise exceeds timeout', async () => {
    vi.useFakeTimers()
    const pending = new Promise<string>(() => {})
    const result = withTimeout(pending, 500, 'pdf extract')
    const expectation = expect(result).rejects.toBeInstanceOf(TimeoutError)
    await vi.advanceTimersByTimeAsync(500)
    await expectation
    vi.useRealTimers()
  })
})
