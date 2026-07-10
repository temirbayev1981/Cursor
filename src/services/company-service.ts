import type { Company, Profile } from '@/types'
import { DEMO_COMPANY, DEMO_COMPANY_B } from '@/data/mock-data'
import { getStoredCompany } from '@/services/onboarding-service'
import { supabase, DEMO_MODE } from '@/lib/supabase'

const REGISTRY_KEY = 'handymanos_company_registry'
const ACTIVE_COMPANY_KEY = 'handymanos_active_company'

function loadRegistry(): Company[] {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY)
    return raw ? (JSON.parse(raw) as Company[]) : []
  } catch {
    return []
  }
}

export function registerCompany(company: Company): void {
  const registry = loadRegistry().filter((item) => item.id !== company.id)
  registry.push(company)
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry))
}

export function listAccessibleCompanies(): Company[] {
  const byId = new Map<string, Company>()
  const stored = getStoredCompany()

  byId.set(DEMO_COMPANY.id, stored?.id === DEMO_COMPANY.id ? stored : DEMO_COMPANY)
  byId.set(DEMO_COMPANY_B.id, DEMO_COMPANY_B)

  for (const company of loadRegistry()) {
    byId.set(company.id, company)
  }

  if (stored && !byId.has(stored.id)) {
    byId.set(stored.id, stored)
  }

  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export function resolveActiveCompany(fallback: Company): Company {
  const activeId = localStorage.getItem(ACTIVE_COMPANY_KEY)
  if (!activeId) return fallback

  return listAccessibleCompanies().find((company) => company.id === activeId) ?? fallback
}

export function setActiveCompany(company: Company): void {
  localStorage.setItem(ACTIVE_COMPANY_KEY, company.id)
  localStorage.setItem('handymanos_company', JSON.stringify(company))
}

export function getActiveCompanyId(): string | null {
  return localStorage.getItem(ACTIVE_COMPANY_KEY)
}

export async function fetchAccessibleCompanies(profile?: Profile | null): Promise<Company[]> {
  if (DEMO_MODE) return listAccessibleCompanies()

  const byId = new Map<string, Company>()
  for (const company of loadRegistry()) {
    byId.set(company.id, company)
  }

  const stored = getStoredCompany()
  if (stored) byId.set(stored.id, stored)

  if (profile?.company_id && supabase) {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single()
    if (data) {
      const companyRow = data as unknown as Company
      byId.set(companyRow.id, companyRow)
    }
  }

  if (byId.size === 0) {
    byId.set(DEMO_COMPANY.id, DEMO_COMPANY)
  }

  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
}
