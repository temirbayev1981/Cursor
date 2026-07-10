import { describe, it, expect } from 'vitest'
import { resolvePostAuthRoute, shouldSkipOnboardingForRole } from './permissions'

describe('permissions post-auth routing', () => {
  it('sends owner without onboarding to wizard', () => {
    expect(resolvePostAuthRoute({ role: 'owner', onboardingComplete: false })).toBe('/onboarding')
  })

  it('sends owner with onboarding to dashboard', () => {
    expect(resolvePostAuthRoute({ role: 'owner', onboardingComplete: true })).toBe('/dashboard')
  })

  it('sends invited technician directly to mobile app', () => {
    expect(shouldSkipOnboardingForRole('technician')).toBe(true)
    expect(resolvePostAuthRoute({ role: 'technician', onboardingComplete: false })).toBe('/tech')
  })

  it('sends dispatcher to dashboard', () => {
    expect(resolvePostAuthRoute({ role: 'dispatcher', onboardingComplete: true })).toBe('/dashboard')
  })
})
