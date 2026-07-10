import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Profile, Company } from '@/types'
import { DEMO_COMPANY } from '@/data/mock-data'
import { DEMO_MODE } from '@/lib/supabase'

interface AuthContextType {
  user: Profile | null
  company: Company | null
  isLoading: boolean
  isAuthenticated: boolean
  onboardingComplete: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  completeOnboarding: () => void
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
  const [onboardingComplete, setOnboardingComplete] = useState(
    () => localStorage.getItem('handymanos_onboarding') === 'complete'
  )

  useEffect(() => {
    if (DEMO_MODE) {
      const stored = localStorage.getItem('handymanos_auth')
      if (stored === 'true') {
        setUser(DEMO_USER)
        setCompany(DEMO_COMPANY)
      }
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }, [])

  const signIn = async (email: string, _password: string) => {
    if (DEMO_MODE) {
      localStorage.setItem('handymanos_auth', 'true')
      setUser({ ...DEMO_USER, email })
      setCompany(DEMO_COMPANY)
    }
  }

  const signOut = async () => {
    localStorage.removeItem('handymanos_auth')
    setUser(null)
    setCompany(null)
  }

  const completeOnboarding = () => {
    localStorage.setItem('handymanos_onboarding', 'complete')
    setOnboardingComplete(true)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        isLoading,
        isAuthenticated: !!user,
        onboardingComplete,
        signIn,
        signOut,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
