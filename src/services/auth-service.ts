import type { Company, Profile, UserRole, Employee } from '@/types'
import type { Json } from '@/types/database'
import { supabase, DEMO_MODE } from '@/lib/supabase'
import { insertRows, upsertRows } from '@/lib/supabase-queries'
import { DEMO_COMPANY, DEMO_COMPANY_B } from '@/data/mock-data'
import { shouldSkipOnboardingForRole } from '@/lib/permissions'
import { getTeamInvitePreview, acceptTeamInvite } from '@/services/invite-service'
import { addCompanyMembership, registerCompany } from '@/services/company-service'
import { setTechOnboardingPending } from '@/services/tech-onboarding-service'
import { loadStore, STORE_KEYS } from '@/lib/data-store'
import { saveEntity } from '@/services/entity-service'

async function ensureEmployeeForInvite(
  profileId: string,
  companyId: string,
  fullName: string,
  role: UserRole,
): Promise<void> {
  if (role !== 'technician') return

  const existing = loadStore<Employee>(STORE_KEYS.employees).find(
    (employee) => employee.profile_id === profileId && employee.company_id === companyId,
  )
  if (existing) return

  await saveEntity('employees', {
    id: crypto.randomUUID(),
    company_id: companyId,
    profile_id: profileId,
    name: fullName,
    role: 'Technician',
    hourly_wage: 0,
    billing_rate: 0,
    payroll_tax_rate: 0.0765,
    insurance_cost_monthly: 200,
    benefits_monthly: 150,
    overhead_allocation: 0.15,
    is_active: true,
    skills: [],
    created_at: new Date().toISOString(),
  })
}

function getStoredCompanyForInvite(companyId: string): Company {
  if (companyId === DEMO_COMPANY_B.id) return DEMO_COMPANY_B
  if (companyId === DEMO_COMPANY.id) return DEMO_COMPANY

  try {
    const raw = localStorage.getItem('handymanos_company')
    if (raw) {
      const stored = JSON.parse(raw) as Company
      if (stored.id === companyId) return stored
    }
  } catch {
    // ignore
  }
  return { ...DEMO_COMPANY, id: companyId }
}

export async function acceptInviteForCurrentUser(
  profileId: string,
  email: string,
  inviteToken: string,
): Promise<{ company: Company; role: UserRole }> {
  const preview = await getTeamInvitePreview(inviteToken)
  if (!preview) throw new Error('Invalid or expired invite')
  if (preview.email.toLowerCase() !== email.toLowerCase().trim()) {
    throw new Error('Email does not match invite')
  }

  const invite = await acceptTeamInvite(inviteToken)
  if (!invite) throw new Error('Failed to accept invite')

  addCompanyMembership(profileId, invite.company_id, invite.role)

  if (DEMO_MODE) {
    const company = getStoredCompanyForInvite(invite.company_id)
    registerCompany(company)
    return { company, role: invite.role }
  }

  if (!supabase) throw new Error('Supabase not configured')

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', invite.company_id)
    .single()

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  return {
    company: (company as unknown as Company) ?? getStoredCompanyForInvite(invite.company_id),
    role: ((profileRow as Profile | null)?.role ?? invite.role) as UserRole,
  }
}

export async function registerUserWithInvite(
  email: string,
  password: string,
  fullName: string,
  inviteToken: string
): Promise<{ profile: Profile; company: Company }> {
  const preview = await getTeamInvitePreview(inviteToken)
  if (!preview) throw new Error('Invalid or expired invite')
  if (preview.email.toLowerCase() !== email.toLowerCase().trim()) {
    throw new Error('Email does not match invite')
  }

  if (DEMO_MODE) {
    const invite = await acceptTeamInvite(inviteToken)
    if (!invite) throw new Error('Invalid or expired invite')

    const profile: Profile = {
      id: crypto.randomUUID(),
      company_id: invite.company_id,
      email,
      full_name: fullName,
      role: invite.role,
      created_at: new Date().toISOString(),
    }
    addCompanyMembership(profile.id, invite.company_id, invite.role)
    const company = getStoredCompanyForInvite(invite.company_id)
    registerCompany(company)
    await ensureEmployeeForInvite(profile.id, invite.company_id, fullName, invite.role)
    if (invite.role === 'technician') setTechOnboardingPending(true)
    return { profile, company }
  }

  if (!supabase) throw new Error('Supabase not configured')

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (authError) throw authError
  if (!authData.user) throw new Error('Registration failed')

  const profile: Profile = {
    id: authData.user.id,
    company_id: preview.company_id,
    email,
    full_name: fullName,
    role: preview.role,
    created_at: new Date().toISOString(),
  }

  const accepted = await acceptTeamInvite(inviteToken)
  if (!accepted) throw new Error('Failed to accept invite')

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single()

  const linkedProfile = (profileRow as unknown as Profile) ?? profile
  await ensureEmployeeForInvite(linkedProfile.id, preview.company_id, fullName, preview.role)
  if (preview.role === 'technician') setTechOnboardingPending(true)

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', preview.company_id)
    .single()

  return {
    profile: linkedProfile,
    company: (company as unknown as Company) ?? DEMO_COMPANY,
  }
}

export async function registerUserWithCompany(
  email: string,
  password: string,
  fullName: string,
  inviteToken?: string
): Promise<{ profile: Profile; company: Company }> {
  if (inviteToken) {
    return registerUserWithInvite(email, password, fullName, inviteToken)
  }

  if (!supabase) throw new Error('Supabase not configured')

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (authError) throw authError
  if (!authData.user) throw new Error('Registration failed')

  const companyId = crypto.randomUUID()
  const company: Company = {
    id: companyId,
    name: `${fullName.split(' ')[0]}'s Handyman Co.`,
    email,
    phone: '',
    address: '',
    subscription_plan: 'starter',
    settings: {},
    created_at: new Date().toISOString(),
  }

  const { error: companyError } = await insertRows('companies', {
    ...company,
    settings: company.settings as Json,
  })
  if (companyError) throw companyError

  const profile: Profile = {
    id: authData.user.id,
    company_id: companyId,
    email,
    full_name: fullName,
    role: 'owner',
    created_at: new Date().toISOString(),
  }

  const { error: profileError } = await upsertRows('profiles', profile)
  if (profileError) throw profileError

  const { error: memberError } = await insertRows('company_members', {
    company_id: companyId,
    profile_id: authData.user.id,
    role: 'owner',
  })
  if (memberError) throw memberError

  return { profile, company }
}

export async function loadUserSession(): Promise<{ profile: Profile; company: Company } | null> {
  if (DEMO_MODE) return null
  if (!supabase) return null

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!profile) return null

  const typedProfile = profile as unknown as Profile
  if (!typedProfile.company_id) return { profile: typedProfile, company: DEMO_COMPANY }

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', typedProfile.company_id)
    .single()

  return {
    profile: typedProfile,
    company: (company as unknown as Company) ?? DEMO_COMPANY,
  }
}

export function isOnboardingComplete(company: Company | null): boolean {
  if (localStorage.getItem('handymanos_onboarding') === 'complete') return true
  const settings = company?.settings as Record<string, unknown> | undefined
  return Boolean(settings?.onboarded_at)
}

export function markOnboardingCompleteForInvitedMember(role: UserRole): void {
  if (shouldSkipOnboardingForRole(role)) {
    localStorage.setItem('handymanos_onboarding', 'complete')
  }
}

export function resolveOnboardingState(role: UserRole, company: Company | null): boolean {
  if (shouldSkipOnboardingForRole(role)) return true
  return isOnboardingComplete(company)
}
