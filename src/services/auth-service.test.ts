import { describe, it, expect, beforeEach } from 'vitest'
import {
  isOnboardingComplete,
  markOnboardingCompleteForInvitedMember,
  resolveOnboardingState,
  formatAuthError,
} from './auth-service'
import { DEMO_COMPANY } from '@/data/mock-data'

describe('auth-service onboarding helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('detects onboarding from localStorage flag', () => {
    localStorage.setItem('handymanos_onboarding', 'complete')
    expect(isOnboardingComplete(null)).toBe(true)
  })

  it('detects onboarding from company settings', () => {
    const company = {
      ...DEMO_COMPANY,
      settings: { onboarded_at: '2024-01-01T00:00:00Z' },
    }
    expect(isOnboardingComplete(company)).toBe(true)
  })

  it('skips onboarding for invited technician', () => {
    markOnboardingCompleteForInvitedMember('technician')
    expect(localStorage.getItem('handymanos_onboarding')).toBe('complete')
    expect(resolveOnboardingState('technician', null)).toBe(true)
  })

  it('requires onboarding for owner without setup', () => {
    expect(resolveOnboardingState('owner', DEMO_COMPANY)).toBe(false)
  })

  it('maps common auth errors to user-facing messages', () => {
    expect(formatAuthError({ message: 'Email not confirmed' }, {
      authError: 'Auth error',
      emailNotConfirmed: 'Confirm email',
      invalidCredentials: 'Bad login',
      accountIncomplete: 'Incomplete',
      profileMissing: 'No profile',
      companyMissing: 'No company',
      registrationPending: 'Pending',
    })).toBe('Confirm email')
  })
})
