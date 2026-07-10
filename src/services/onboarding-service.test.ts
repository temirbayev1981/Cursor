import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadOnboardingData,
  saveOnboardingData,
  getStoredCompany,
} from './onboarding-service'
import { DEMO_COMPANY } from '@/data/mock-data'

describe('onboarding-service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and loads onboarding draft', () => {
    const draft = {
      company: { name: 'Test Co', email: 'test@co.com', phone: '', address: '' },
      services: [{ name: 'Plumbing', description: '' }],
      pricing: { hourly_rate: 85, emergency_multiplier: 1.5, weekend_multiplier: 1.25, property_mgmt_discount: 0.1 },
      employees: [],
      vehicles: [],
      materials: [],
    }
    saveOnboardingData(draft)
    expect(loadOnboardingData()?.company.name).toBe('Test Co')
  })

  it('reads stored company from localStorage', () => {
    localStorage.setItem('handymanos_company', JSON.stringify(DEMO_COMPANY))
    expect(getStoredCompany()?.id).toBe(DEMO_COMPANY.id)
  })
})
