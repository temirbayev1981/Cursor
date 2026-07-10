import type { Company, Profile } from '@/types'
import { supabase, DEMO_MODE } from '@/lib/supabase'
import { DEMO_COMPANY } from '@/data/mock-data'
import { getTeamInvitePreview, acceptTeamInvite } from '@/services/invite-service'

function getStoredCompanyForInvite(companyId: string): Company {
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

export async function registerUserWithInvite(
  email: string,
  password: string,
  fullName: string,
  inviteToken: string
): Promise<{ profile: Profile; company: Company }> {
  const preview = await getTeamInvitePreview(inviteToken)
  if (!preview) throw new Error('Invalid or expired invite')

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
    return { profile, company: getStoredCompanyForInvite(invite.company_id) }
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

  const { error: profileError } = await supabase.from('profiles').upsert(profile as never)
  if (profileError) throw profileError

  await acceptTeamInvite(inviteToken)

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', preview.company_id)
    .single()

  return {
    profile,
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

  const { error: companyError } = await supabase.from('companies').insert(company as never)
  if (companyError) throw companyError

  const profile: Profile = {
    id: authData.user.id,
    company_id: companyId,
    email,
    full_name: fullName,
    role: 'owner',
    created_at: new Date().toISOString(),
  }

  const { error: profileError } = await supabase.from('profiles').upsert(profile as never)
  if (profileError) throw profileError

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
