import { describe, it, expect, beforeEach } from 'vitest'
import {
  isTechOnboardingPending,
  setTechOnboardingPending,
  completeTechOnboarding,
} from './tech-onboarding-service'

describe('tech-onboarding-service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('tracks pending state', () => {
    expect(isTechOnboardingPending()).toBe(false)
    setTechOnboardingPending(true)
    expect(isTechOnboardingPending()).toBe(true)
    setTechOnboardingPending(false)
    expect(isTechOnboardingPending()).toBe(false)
  })

  it('completes onboarding and creates employee link', async () => {
    setTechOnboardingPending(true)
    await completeTechOnboarding(
      { fullName: 'Sam Tech', phone: '(555) 000-1111', skills: ['Plumbing'] },
      'user-tech-1',
      'comp-001',
    )
    expect(isTechOnboardingPending()).toBe(false)
    const employees = JSON.parse(localStorage.getItem('handymanos_employees') || '[]') as Array<{ profile_id?: string }>
    expect(employees.some((employee) => employee.profile_id === 'user-tech-1')).toBe(true)
  })
})
