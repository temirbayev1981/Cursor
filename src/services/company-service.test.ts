import { describe, it, expect, beforeEach } from 'vitest'
import { DEMO_COMPANY, DEMO_COMPANY_B } from '@/data/mock-data'
import { listAccessibleCompanies, registerCompany, setActiveCompany, resolveActiveCompany, fetchAccessibleCompanies, updateCompanyProfile, addCompanyMembership } from './company-service'

describe('company-service', () => {
  beforeEach(() => {
    localStorage.clear()
    registerCompany(DEMO_COMPANY)
    registerCompany(DEMO_COMPANY_B)
  })

  it('lists registered companies', () => {
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

  it('fetchAccessibleCompanies returns registered companies', async () => {
    const companies = await fetchAccessibleCompanies()
    expect(companies.length).toBeGreaterThanOrEqual(2)
  })

  it('addCompanyMembership exposes invited company in list', () => {
    addCompanyMembership('user-999', 'comp-002', 'dispatcher')
    const companies = listAccessibleCompanies('user-999')
    expect(companies.some((company) => company.id === 'comp-002')).toBe(true)
  })

  it('updateCompanyProfile updates local storage', async () => {
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
