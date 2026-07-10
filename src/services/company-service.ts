import type { Company, Profile, UserRole } from '@/types'
import { DEMO_COMPANY, DEMO_COMPANY_B } from '@/data/mock-data'
import { getStoredCompany } from '@/services/onboarding-service'
import { supabase, DEMO_MODE } from '@/lib/supabase'
import { updateRows } from '@/lib/supabase-queries'
import { callRpc } from '@/lib/supabase-rpc'

const REGISTRY_KEY = 'handymanos_company_registry'
const ACTIVE_COMPANY_KEY = 'handymanos_active_company'
const MEMBERSHIPS_KEY = 'handymanos_company_memberships'

interface StoredMembership {
  profile_id: string
  company_id: string
  role: UserRole
}

function loadMemberships(): StoredMembership[] {
  try {
    const raw = localStorage.getItem(MEMBERSHIPS_KEY)
    return raw ? (JSON.parse(raw) as StoredMembership[]) : []
  } catch {
    return []
  }
}

export function addCompanyMembership(profileId: string, companyId: string, role: UserRole): void {
  const memberships = loadMemberships().filter(
    (item) => !(item.profile_id === profileId && item.company_id === companyId),
  )
  memberships.push({ profile_id: profileId, company_id: companyId, role })
  localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(memberships))
}

export function getMembershipCompanyIds(profileId: string): string[] {
  return loadMemberships()
    .filter((item) => item.profile_id === profileId)
    .map((item) => item.company_id)
}

function companyById(companyId: string): Company | undefined {
  if (companyId === DEMO_COMPANY.id) return DEMO_COMPANY
  if (companyId === DEMO_COMPANY_B.id) return DEMO_COMPANY_B
  return loadRegistry().find((company) => company.id === companyId)
}

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

export function listAccessibleCompanies(profileId?: string): Company[] {
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

  if (profileId) {
    for (const companyId of getMembershipCompanyIds(profileId)) {
      const company = companyById(companyId)
      if (company) byId.set(company.id, company)
    }
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

/** Persist active company to Supabase profile (demo switcher uses local registry only). */
export async function syncActiveCompanyToProfile(profileId: string, companyId: string): Promise<void> {
  if (DEMO_MODE || !supabase) return

  const { error } = await updateRows('profiles', { company_id: companyId }, 'id', profileId)
  if (error) throw error
}

export type CompanyProfilePatch = Pick<Company, 'name' | 'email' | 'phone' | 'address'>

export async function updateCompanyProfile(
  companyId: string,
  patch: CompanyProfilePatch,
): Promise<Company> {
  const stored = getStoredCompany()
  const base =
    (stored?.id === companyId ? stored : null)
    ?? listAccessibleCompanies().find((company) => company.id === companyId)

  if (!base) throw new Error('Company not found')

  const updated: Company = { ...base, ...patch }
  localStorage.setItem('handymanos_company', JSON.stringify(updated))
  registerCompany(updated)

  if (!DEMO_MODE && supabase) {
    const { error } = await updateRows(
      'companies',
      {
        name: patch.name,
        email: patch.email,
        phone: patch.phone || undefined,
        address: patch.address || undefined,
      },
      'id',
      companyId,
    )
    if (error) throw error
  }

  return updated
}

export async function fetchAccessibleCompanies(profile?: Profile | null): Promise<Company[]> {
  if (DEMO_MODE) return listAccessibleCompanies(profile?.id)

  const byId = new Map<string, Company>()
  for (const company of loadRegistry()) {
    byId.set(company.id, company)
  }

  const stored = getStoredCompany()
  if (stored) byId.set(stored.id, stored)

  if (profile && supabase) {
    const { data: memberships, error } = await callRpc('get_accessible_companies', {})
    if (!error && memberships && memberships.length > 0) {
      for (const row of memberships as Company[]) {
        byId.set(row.id, row)
      }
    } else if (profile.company_id) {
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
  }

  if (byId.size === 0) {
    byId.set(DEMO_COMPANY.id, DEMO_COMPANY)
  }

  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export function userCanAccessCompany(profile: Profile | null, companyId: string, companies: Company[]): boolean {
  if (!profile) return false
  return companies.some((company) => company.id === companyId)
}
