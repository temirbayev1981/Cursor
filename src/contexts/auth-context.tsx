import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Profile, Company, UserRole, OnboardingData } from '@/types'
import { supabase, DEMO_MODE } from '@/lib/supabase'
import { DEMO_COMPANY } from '@/data/mock-data'
import { getStoredCompany, persistOnboarding } from '@/services/onboarding-service'
import { registerUserWithCompany, loadUserSession, isOnboardingComplete } from '@/services/auth-service'

interface AuthContextType {
  user: Profile | null
  company: Company | null
  isLoading: boolean
  isAuthenticated: boolean
  onboardingComplete: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  completeOnboarding: (data?: OnboardingData) => Promise<void>
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
        const comp = getStoredCompany() ?? DEMO_COMPANY
        setCompany(comp)
        setOnboardingComplete(localStorage.getItem('handymanos_onboarding') === 'complete')
      }
      setIsLoading(false)
      return
    }

    const session = await loadUserSession()
    if (session) {
      setUser(session.profile)
      setCompany(session.company)
      setOnboardingComplete(isOnboardingComplete(session.company))
      localStorage.setItem('handymanos_auth', 'true')
    }
    setIsLoading(false)

    if (supabase) {
      supabase.auth.onAuthStateChange(async (_event, authSession) => {
        if (!authSession) {
          setUser(null)
          setCompany(null)
          setOnboardingComplete(false)
          localStorage.removeItem('handymanos_auth')
        }
      })
    }
  }, [])

  useEffect(() => { restoreSession() }, [restoreSession])

  const signUp = async (email: string, password: string, fullName: string) => {
    if (DEMO_MODE) {
      localStorage.setItem('handymanos_auth', 'true')
      setUser({ ...DEMO_USER, email, full_name: fullName })
      setCompany(getStoredCompany() ?? DEMO_COMPANY)
      setOnboardingComplete(localStorage.getItem('handymanos_onboarding') === 'complete')
      return
    }

    const { profile, company: newCompany } = await registerUserWithCompany(email, password, fullName)
    setUser(profile)
    setCompany(newCompany)
    setOnboardingComplete(false)
    localStorage.setItem('handymanos_auth', 'true')
  }

  const signIn = async (email: string, password: string) => {
    if (DEMO_MODE) {
      localStorage.setItem('handymanos_auth', 'true')
      setUser({ ...DEMO_USER, email })
      const comp = getStoredCompany() ?? DEMO_COMPANY
      setCompany(comp)
      setOnboardingComplete(localStorage.getItem('handymanos_onboarding') === 'complete')
      return
    }

    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await restoreSession()
  }

  const signOut = async () => {
    localStorage.removeItem('handymanos_auth')
    if (supabase && !DEMO_MODE) await supabase.auth.signOut()
    setUser(null)
    setCompany(null)
    setOnboardingComplete(false)
  }

  const completeOnboarding = async (data?: OnboardingData) => {
    if (data && user) {
      const updatedCompany = await persistOnboarding(data, user.company_id, user.id)
      setCompany(updatedCompany)
    } else {
      localStorage.setItem('handymanos_onboarding', 'complete')
    }
    setOnboardingComplete(true)
  }

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{
      user, company, isLoading, isAuthenticated: !!user, onboardingComplete,
      signIn, signUp, signOut, completeOnboarding, hasRole,
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
