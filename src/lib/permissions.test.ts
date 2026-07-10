import { describe, it, expect, beforeEach } from 'vitest'
import { resolvePostAuthRoute, shouldSkipOnboardingForRole } from './permissions'
import { setTechOnboardingPending } from '@/services/tech-onboarding-service'

describe('permissions post-auth routing', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('sends owner without onboarding to wizard', () => {
    expect(resolvePostAuthRoute({ role: 'owner', onboardingComplete: false })).toBe('/onboarding')
  })

  it('sends owner with onboarding to dashboard', () => {
    expect(resolvePostAuthRoute({ role: 'owner', onboardingComplete: true })).toBe('/dashboard')
  })

  it('sends invited technician to lite onboarding when pending', () => {
    expect(shouldSkipOnboardingForRole('technician')).toBe(true)
    setTechOnboardingPending(true)
    expect(resolvePostAuthRoute({ role: 'technician', onboardingComplete: false })).toBe('/tech-onboarding')
    setTechOnboardingPending(false)
    expect(resolvePostAuthRoute({ role: 'technician', onboardingComplete: false })).toBe('/tech')
  })

  it('sends dispatcher to dashboard', () => {
    expect(resolvePostAuthRoute({ role: 'dispatcher', onboardingComplete: true })).toBe('/dashboard')
  })
})
