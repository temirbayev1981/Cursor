import type { Employee } from '@/types'
import { supabase, DEMO_MODE } from '@/lib/supabase'
import { loadStore, STORE_KEYS } from '@/lib/data-store'
import { saveEntity } from '@/services/entity-service'

const TECH_ONBOARDING_KEY = 'handymanos_tech_onboarding'

export const TECH_SKILL_OPTIONS = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Carpentry',
  'Painting',
  'Drywall',
  'Appliance repair',
  'General maintenance',
] as const

export interface TechOnboardingData {
  fullName: string
  phone: string
  skills: string[]
}

export function isTechOnboardingPending(): boolean {
  return localStorage.getItem(TECH_ONBOARDING_KEY) === 'pending'
}

export function setTechOnboardingPending(pending: boolean): void {
  if (pending) localStorage.setItem(TECH_ONBOARDING_KEY, 'pending')
  else localStorage.removeItem(TECH_ONBOARDING_KEY)
}

export async function completeTechOnboarding(
  data: TechOnboardingData,
  userId: string,
  companyId: string,
): Promise<void> {
  if (!DEMO_MODE && supabase) {
    await supabase
      .from('profiles')
      .update({ full_name: data.fullName, phone: data.phone } as never)
      .eq('id', userId)
  }

  const existing = loadStore<Employee>(STORE_KEYS.employees).find(
    (employee) => employee.profile_id === userId && employee.company_id === companyId,
  )

  const employee: Employee = existing
    ? {
        ...existing,
        name: data.fullName,
        phone: data.phone,
        skills: data.skills,
        is_active: true,
      }
    : {
        id: crypto.randomUUID(),
        company_id: companyId,
        profile_id: userId,
        name: data.fullName,
        phone: data.phone,
        role: 'Technician',
        hourly_wage: 0,
        billing_rate: 0,
        payroll_tax_rate: 0.0765,
        insurance_cost_monthly: 200,
        benefits_monthly: 150,
        overhead_allocation: 0.15,
        is_active: true,
        skills: data.skills,
        created_at: new Date().toISOString(),
      }

  await saveEntity('employees', employee)
  setTechOnboardingPending(false)
}
