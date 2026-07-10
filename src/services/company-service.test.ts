import { describe, it, expect, beforeEach } from 'vitest'
import { DEMO_COMPANY, DEMO_COMPANY_B } from '@/data/mock-data'
import { listAccessibleCompanies, registerCompany, setActiveCompany, resolveActiveCompany, fetchAccessibleCompanies } from './company-service'

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
})
