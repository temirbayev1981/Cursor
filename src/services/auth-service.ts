import type { Company, Profile, UserRole, Employee } from '@/types'
import { supabase } from '@/lib/supabase'
import { insertRows, updateRows } from '@/lib/supabase-queries'
import { shouldSkipOnboardingForRole } from '@/lib/permissions'
import { getTeamInvitePreview, acceptTeamInvite } from '@/services/invite-service'
import { addCompanyMembership } from '@/services/company-service'
import { setTechOnboardingPending } from '@/services/tech-onboarding-service'
import { loadStore, STORE_KEYS } from '@/lib/data-store'
import { saveEntity } from '@/services/entity-service'

export type AuthErrorMessages = {
  authError: string
  emailNotConfirmed: string
  invalidCredentials: string
  accountIncomplete: string
  profileMissing: string
  companyMissing: string
  registrationPending: string
}

export function formatAuthError(error: unknown, messages?: AuthErrorMessages): string {
  const fallback = messages?.authError ?? 'Authentication error'
  if (!error) return fallback
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = String((error as { message: string }).message)
    if (/email not confirmed/i.test(message)) return messages?.emailNotConfirmed ?? message
    if (/invalid login credentials/i.test(message)) return messages?.invalidCredentials ?? message
    if (/session not found/i.test(message)) return messages?.accountIncomplete ?? message
    if (/account setup is incomplete/i.test(message)) return messages?.accountIncomplete ?? message
    if (/profile not found/i.test(message)) return messages?.profileMissing ?? message
    if (/company not found/i.test(message)) return messages?.companyMissing ?? message
    if (/confirm your email/i.test(message)) return messages?.registrationPending ?? message
    return message || fallback
  }
  if (error instanceof Error) return error.message || fallback
  return fallback
}

async function provisionOwnerCompanyIfNeeded(): Promise<boolean> {
  if (!supabase) return false

  const { data, error } = await supabase.rpc('provision_owner_company')
  if (error) return false
  return Boolean(data)
}

async function repairOwnerSessionClient(user: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured')

  const userId = user.id
  const email = user.email ?? ''
  const fullName = String((user.user_metadata?.full_name as string | undefined) ?? email.split('@')[0] ?? 'Owner')

  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) throw new Error(profileError.message)

  const profileRow = existingProfile as Profile | null
  if (profileRow?.company_id) {
    return profileRow.company_id
  }

  if (!profileRow) {
    const { error: insertProfileError } = await insertRows('profiles', {
      id: userId,
      email,
      full_name: fullName,
      role: 'owner',
    })
    if (insertProfileError) throw new Error(insertProfileError.message)
  }

  const companyId = crypto.randomUUID()
  const { error: companyError } = await insertRows('companies', {
    id: companyId,
    name: `${fullName}'s Handyman Co.`,
    email,
    subscription_plan: 'starter',
    settings: {},
  })
  if (companyError) throw new Error(companyError.message)

  const { error: updateProfileError } = await updateRows(
    'profiles',
    { company_id: companyId, role: 'owner' },
    'id',
    userId,
  )
  if (updateProfileError) throw new Error(updateProfileError.message)

  await insertRows('company_members', {
    company_id: companyId,
    profile_id: userId,
    role: 'owner',
  })

  return companyId
}

export async function ensureOwnerCompanyLinked(user: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    await repairOwnerSessionClient(user)
    return
  } catch {
    const rpcOk = await provisionOwnerCompanyIfNeeded()
    if (!rpcOk) {
      throw new Error('Account setup is incomplete. Contact support or re-run supabase/schema-patch.sql in Supabase SQL Editor.')
    }
  }
}

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

async function fetchCompanyById(companyId: string): Promise<Company> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()

  if (error || !company) throw new Error('Company not found')
  return company as unknown as Company
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

  if (!supabase) throw new Error('Supabase not configured')

  const company = await fetchCompanyById(invite.company_id)

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  return {
    company,
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

  if (!supabase) throw new Error('Supabase not configured')

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, signup_type: 'invite' } },
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

  const company = await fetchCompanyById(preview.company_id)

  return { profile: linkedProfile, company }
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
    options: { data: { full_name: fullName, signup_type: 'owner' } },
  })
  if (authError) throw authError
  if (!authData.user) throw new Error('Registration failed')

  const session = await loadUserSession()
  if (session) return session

  if (authData.session?.user) {
    try {
      await ensureOwnerCompanyLinked(authData.session.user)
      const repairedSession = await loadUserSession()
      if (repairedSession) return repairedSession
    } catch {
      // fall through to registration pending message
    }
  }

  throw new Error('Registration succeeded. Confirm your email if required, then sign in.')
}

export async function loadUserSession(): Promise<{ profile: Profile; company: Company } | null> {
  if (!supabase) return null

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle()

  if (profileError) return null

  let typedProfile = profile as unknown as Profile | null
  if (!typedProfile?.company_id) {
    try {
      await ensureOwnerCompanyLinked(session.user)
    } catch {
      return null
    }

    const { data: repairedProfile, error: repairedError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()

    if (repairedError || !(repairedProfile as Profile | null)?.company_id) return null
    typedProfile = repairedProfile as unknown as Profile
  }

  const company = await fetchCompanyById(typedProfile.company_id)
  return { profile: typedProfile, company }
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
