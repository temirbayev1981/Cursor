import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Profile, Company, UserRole, OnboardingData } from '@/types'
import { supabase, DEMO_MODE } from '@/lib/supabase'
import { DEMO_COMPANY } from '@/data/mock-data'
import { getStoredCompany, persistOnboarding } from '@/services/onboarding-service'
import { registerUserWithCompany, loadUserSession, markOnboardingCompleteForInvitedMember, resolveOnboardingState } from '@/services/auth-service'
import { type PostAuthState } from '@/lib/permissions'
import { resolveActiveCompany, setActiveCompany, registerCompany, listAccessibleCompanies, syncActiveCompanyToProfile, updateCompanyProfile, type CompanyProfilePatch } from '@/services/company-service'
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
  updateCompanyDetails: (patch: CompanyProfilePatch) => Promise<void>
  switchCompany: (companyId: string) => Promise<void>
  hasRole: (...roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEMO_USER: Profile = {
  id: 'user-001',
  company_id: 'comp-001',
  email: 'owner@profixhandyman.com',
  full_name: 'Alex Morgan',
  role: 'owner',
  phone: '(555) 123-4567',
  created_at: '2024-01-15T00:00:00Z',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  const restoreSession = useCallback(async () => {
    if (DEMO_MODE) {
      const stored = localStorage.getItem('handymanos_auth')
      if (stored === 'true') {
        setUser(DEMO_USER)
        const comp = resolveActiveCompany(getStoredCompany() ?? DEMO_COMPANY)
        setCompany(comp)
        setActiveCompany(comp)
        setOnboardingComplete(localStorage.getItem('handymanos_onboarding') === 'complete')
      }
      setIsLoading(false)
      return
    }

    const session = await loadUserSession()
    if (session) {
      setUser(session.profile)
      setCompany(session.company)
      setOnboardingComplete(resolveOnboardingState(session.profile.role, session.company))
      localStorage.setItem('handymanos_auth', 'true')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { void restoreSession() }, [restoreSession])

  useEffect(() => {
    if (!supabase || DEMO_MODE) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (!authSession) {
        setUser(null)
        setCompany(null)
        setOnboardingComplete(false)
        localStorage.removeItem('handymanos_auth')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName: string, inviteToken?: string): Promise<PostAuthState> => {
    if (DEMO_MODE) {
      if (inviteToken) {
        const { registerUserWithInvite } = await import('@/services/auth-service')
        const { profile, company: invitedCompany } = await registerUserWithInvite(email, password, fullName, inviteToken)
        markOnboardingCompleteForInvitedMember(profile.role)
        const complete = resolveOnboardingState(profile.role, invitedCompany)
        localStorage.setItem('handymanos_auth', 'true')
        setUser(profile)
        setCompany(invitedCompany)
        setOnboardingComplete(complete)
        return { role: profile.role, onboardingComplete: complete }
      }
      localStorage.setItem('handymanos_auth', 'true')
      const demoProfile = { ...DEMO_USER, email, full_name: fullName }
      setUser(demoProfile)
      const comp = resolveActiveCompany(getStoredCompany() ?? DEMO_COMPANY)
      setCompany(comp)
      setActiveCompany(comp)
      const complete = localStorage.getItem('handymanos_onboarding') === 'complete'
      setOnboardingComplete(complete)
      return { role: demoProfile.role, onboardingComplete: complete }
    }

    const { profile, company: newCompany } = await registerUserWithCompany(email, password, fullName, inviteToken)
    if (inviteToken) markOnboardingCompleteForInvitedMember(profile.role)
    const complete = inviteToken ? resolveOnboardingState(profile.role, newCompany) : false
    setUser(profile)
    setCompany(newCompany)
    setOnboardingComplete(complete)
    localStorage.setItem('handymanos_auth', 'true')
    return { role: profile.role, onboardingComplete: complete }
  }

  const signIn = async (email: string, password: string): Promise<PostAuthState> => {
    if (DEMO_MODE) {
      localStorage.setItem('handymanos_auth', 'true')
      const demoProfile = { ...DEMO_USER, email }
      setUser(demoProfile)
      const comp = resolveActiveCompany(getStoredCompany() ?? DEMO_COMPANY)
      setCompany(comp)
      setActiveCompany(comp)
      const complete = localStorage.getItem('handymanos_onboarding') === 'complete'
      setOnboardingComplete(complete)
      return { role: demoProfile.role, onboardingComplete: complete }
    }

    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await restoreSession()
    const session = await loadUserSession()
    if (!session) throw new Error('Session not found')
    const complete = resolveOnboardingState(session.profile.role, session.company)
    setOnboardingComplete(complete)
    return { role: session.profile.role, onboardingComplete: complete }
  }

  const signOut = async () => {
    localStorage.removeItem('handymanos_auth')
    setTechOnboardingPending(false)
    if (supabase && !DEMO_MODE) await supabase.auth.signOut()
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

  const switchCompany = async (companyId: string) => {
    if (!user) return
    const nextCompany = listAccessibleCompanies().find((item) => item.id === companyId)
    if (!nextCompany) return

    setActiveCompany(nextCompany)
    setCompany(nextCompany)
    setUser({ ...user, company_id: companyId })

    if (!DEMO_MODE) {
      await syncActiveCompanyToProfile(user.id, companyId)
    }

    await logAudit(companyId, user.id, 'company.switch', 'company', companyId)
  }

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{
      user, company, isLoading, isAuthenticated: !!user, onboardingComplete,
      signIn, signUp, signOut, completeOnboarding, updateCompanyDetails, switchCompany, hasRole,
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
