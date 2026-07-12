import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Profile, Company, UserRole, OnboardingData } from '@/types'
import { supabase } from '@/lib/supabase'
import { persistOnboarding } from '@/services/onboarding-service'
import { registerUserWithCompany, loadUserSession, markOnboardingCompleteForInvitedMember, resolveOnboardingState, acceptInviteForCurrentUser, ensureOwnerCompanyLinked } from '@/services/auth-service'
import { type PostAuthState } from '@/lib/permissions'
import { setActiveCompany, registerCompany, fetchAccessibleCompanies, syncActiveCompanyToProfile, updateCompanyProfile, type CompanyProfilePatch } from '@/services/company-service'
import { logAudit } from '@/services/entity-service'
import { setTechOnboardingPending } from '@/services/tech-onboarding-service'

interface AuthContextType {
  user: Profile | null
  company: Company | null
  isLoading: boolean
  isAuthenticated: boolean
  onboardingComplete: boolean
  signIn: (email: string, password: string) => Promise<PostAuthState>
  signUp: (email: string, password: string, fullName: string, inviteToken?: string) => Promise<PostAuthState>
  signOut: () => Promise<void>
  completeOnboarding: (data?: OnboardingData) => Promise<void>
  acceptInvite: (token: string, session?: Pick<Profile, 'id' | 'email'>) => Promise<void>
  updateCompanyDetails: (patch: CompanyProfilePatch) => Promise<void>
  switchCompany: (companyId: string) => Promise<void>
  hasRole: (...roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  const restoreSession = useCallback(async () => {
    try {
      const session = await Promise.race([
        loadUserSession(),
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 8000)),
      ])
      if (session) {
        setUser(session.profile)
        setCompany(session.company)
        setOnboardingComplete(resolveOnboardingState(session.profile.role, session.company))
        localStorage.setItem('handymanos_auth', 'true')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void restoreSession() }, [restoreSession])

  useEffect(() => {
    if (!supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, authSession) => {
      if (!authSession) {
        setUser(null)
        setCompany(null)
        setOnboardingComplete(false)
        localStorage.removeItem('handymanos_auth')
        return
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        void restoreSession()
      }
    })

    return () => subscription.unsubscribe()
  }, [restoreSession])

  const signUp = async (email: string, password: string, fullName: string, inviteToken?: string): Promise<PostAuthState> => {
    const { profile, company: newCompany } = await registerUserWithCompany(email, password, fullName, inviteToken)
    if (inviteToken) markOnboardingCompleteForInvitedMember(profile.role)
    const complete = inviteToken ? resolveOnboardingState(profile.role, newCompany) : false
    setUser(profile)
    setCompany(newCompany)
    setOnboardingComplete(complete)
    localStorage.setItem('handymanos_auth', 'true')
    return { role: profile.role, onboardingComplete: complete, profile: { id: profile.id, email: profile.email } }
  }

  const signIn = async (email: string, password: string): Promise<PostAuthState> => {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    const authUser = data.user ?? data.session?.user
    if (authUser) {
      await ensureOwnerCompanyLinked(authUser)
    }

    const session = await loadUserSession()
    if (!session) throw new Error('Session not found')

    setUser(session.profile)
    setCompany(session.company)
    const complete = resolveOnboardingState(session.profile.role, session.company)
    setOnboardingComplete(complete)
    localStorage.setItem('handymanos_auth', 'true')
    return {
      role: session.profile.role,
      onboardingComplete: complete,
      profile: { id: session.profile.id, email: session.profile.email },
    }
  }

  const signOut = async () => {
    localStorage.removeItem('handymanos_auth')
    setTechOnboardingPending(false)
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setCompany(null)
    setOnboardingComplete(false)
  }

  const completeOnboarding = async (data?: OnboardingData) => {
    if (data && user) {
      const updatedCompany = await persistOnboarding(data, user.company_id, user.id)
      registerCompany(updatedCompany)
      setActiveCompany(updatedCompany)
      setCompany(updatedCompany)
    } else {
      localStorage.setItem('handymanos_onboarding', 'complete')
    }
    setOnboardingComplete(true)
  }

  const updateCompanyDetails = async (patch: CompanyProfilePatch) => {
    if (!company) return
    const updated = await updateCompanyProfile(company.id, patch)
    setActiveCompany(updated)
    setCompany(updated)
  }

  const acceptInvite = async (token: string, session?: Pick<Profile, 'id' | 'email'>) => {
    const currentUser = session ?? user
    if (!currentUser) throw new Error('Not authenticated')
    const { company: invitedCompany, role } = await acceptInviteForCurrentUser(currentUser.id, currentUser.email, token)
    registerCompany(invitedCompany)
    setActiveCompany(invitedCompany)
    setCompany(invitedCompany)
    setUser({
      ...(user ?? {
        id: currentUser.id,
        company_id: invitedCompany.id,
        email: currentUser.email,
        full_name: currentUser.email.split('@')[0],
        role,
        created_at: new Date().toISOString(),
      }),
      id: currentUser.id,
      email: currentUser.email,
      company_id: invitedCompany.id,
      role,
    })
    markOnboardingCompleteForInvitedMember(role)
    setOnboardingComplete(resolveOnboardingState(role, invitedCompany))
    await syncActiveCompanyToProfile(currentUser.id, invitedCompany.id)
    await logAudit(invitedCompany.id, currentUser.id, 'invite.accept', 'team_invite', token.slice(0, 36))
  }

  const switchCompany = async (companyId: string) => {
    if (!user) return
    const accessible = await fetchAccessibleCompanies(user)
    const nextCompany = accessible.find((item) => item.id === companyId)
    if (!nextCompany) return

    setActiveCompany(nextCompany)
    setCompany(nextCompany)
    setUser({ ...user, company_id: companyId })
    await syncActiveCompanyToProfile(user.id, companyId)
    await logAudit(companyId, user.id, 'company.switch', 'company', companyId)
  }

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{
      user, company, isLoading, isAuthenticated: !!user, onboardingComplete,
      signIn, signUp, signOut, completeOnboarding, acceptInvite, updateCompanyDetails, switchCompany, hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function RoleGuard({ roles, children, fallback }: { roles: UserRole[]; children: ReactNode; fallback?: ReactNode }) {
  const { hasRole, isLoading } = useAuth()
  if (isLoading) return null
  if (!hasRole(...roles)) return <>{fallback ?? null}</>
  return <>{children}</>
}
