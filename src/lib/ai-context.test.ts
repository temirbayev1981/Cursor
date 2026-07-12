import { describe, it, expect } from 'vitest'
import { buildBusinessContext, EMPTY_AI_BUSINESS_CONTEXT } from '@/lib/ai-context'

describe('ai-context', () => {
  it('builds localized business snapshot from aggregate stats', () => {
    const context = buildBusinessContext(
      {
        customerCount: 12,
        jobCount: 34,
        openJobs: 5,
        revenue: 12500,
        profit: 4200,
        outstanding: 800,
      },
      'en',
    )

    expect(context).toContain('12')
    expect(context).toContain('34')
    expect(context).toContain('5')
    expect(context).toContain('12500')
    expect(context).toContain('4200')
    expect(context).toContain('800')
  })

  it('returns zeroed snapshot for empty stats', () => {
    const context = buildBusinessContext(EMPTY_AI_BUSINESS_CONTEXT, 'ru')
    expect(context).toContain('0')
  })
})
