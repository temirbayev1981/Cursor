import { describe, it, expect, beforeEach } from 'vitest'
import { DEMO_COMPANY, DEMO_COMPANY_B } from '@/data/mock-data'
import { listAccessibleCompanies, registerCompany, setActiveCompany, resolveActiveCompany, fetchAccessibleCompanies, updateCompanyProfile } from './company-service'

describe('company-service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('lists default demo companies', () => {
    const companies = listAccessibleCompanies()
    expect(companies.some((company) => company.id === DEMO_COMPANY.id)).toBe(true)
    expect(companies.some((company) => company.id === DEMO_COMPANY_B.id)).toBe(true)
  })

  it('registers and resolves active company', () => {
    const custom = { ...DEMO_COMPANY, id: 'comp-999', name: 'Custom Co' }
    registerCompany(custom)
    setActiveCompany(custom)

    const active = resolveActiveCompany(DEMO_COMPANY)
    expect(active.id).toBe('comp-999')
    expect(active.name).toBe('Custom Co')
  })

  it('fetchAccessibleCompanies returns demo registry in demo mode', async () => {
    const companies = await fetchAccessibleCompanies()
    expect(companies.length).toBeGreaterThanOrEqual(2)
  })

  it('updateCompanyProfile updates local storage in demo mode', async () => {
    setActiveCompany(DEMO_COMPANY)
    const updated = await updateCompanyProfile(DEMO_COMPANY.id, {
      name: 'Updated Handyman Co',
      email: 'new@example.com',
      phone: '(555) 000-0000',
      address: '1 New Street',
    })

    expect(updated.name).toBe('Updated Handyman Co')
    expect(updated.email).toBe('new@example.com')

    const stored = JSON.parse(localStorage.getItem('handymanos_company') || '{}') as { name: string }
    expect(stored.name).toBe('Updated Handyman Co')
  })
})
