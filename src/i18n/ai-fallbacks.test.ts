import { describe, it, expect } from 'vitest'
import { getAIFallbacks } from '@/i18n/ai-fallbacks'

describe('ai-fallbacks', () => {
  it('returns Russian system prompt for ru locale', () => {
    const fallbacks = getAIFallbacks('ru')
    expect(fallbacks.systemPrompt).toContain('HandymanOS')
    expect(fallbacks.lostMoney).toContain('JOB-0087')
  })

  it('returns English business snapshot template for en locale', () => {
    const fallbacks = getAIFallbacks('en')
    expect(fallbacks.businessSnapshot).toContain('{customers}')
    expect(fallbacks.default).toContain('Monthly revenue')
  })
})
