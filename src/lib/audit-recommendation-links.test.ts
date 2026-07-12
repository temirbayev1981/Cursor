import { describe, it, expect } from 'vitest'
import { integrationKeyForRecommendation } from './audit-recommendation-links'

describe('audit-recommendation-links', () => {
  it('maps integration recommendations to integration cards', () => {
    expect(integrationKeyForRecommendation('configure_stripe')).toBe('stripe')
    expect(integrationKeyForRecommendation('enable_email')).toBe('email')
    expect(integrationKeyForRecommendation('configure_openai')).toBe('openai')
  })

  it('returns null for non-integration recommendations', () => {
    expect(integrationKeyForRecommendation('offline_sync')).toBeNull()
    expect(integrationKeyForRecommendation('all_ready')).toBeNull()
  })
})
