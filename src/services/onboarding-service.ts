import type { OnboardingData, Company, Employee, Vehicle, Material } from '@/types'
import type { Json } from '@/types/database'
import { saveEntity } from '@/services/entity-service'
import { supabase, DEMO_MODE } from '@/lib/supabase'
import { upsertRows } from '@/lib/supabase-queries'

const ONBOARDING_KEY = 'handymanos_onboarding_data'

export function loadOnboardingData(): OnboardingData | null {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY)
    return raw ? (JSON.parse(raw) as OnboardingData) : null
  } catch {
    return null
  }
}

export function saveOnboardingData(data: OnboardingData): void {
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(data))
}

export async function persistOnboarding(data: OnboardingData, companyId: string, userId: string): Promise<Company> {
  saveOnboardingData(data)

  const company: Company = {
    id: companyId,
    name: data.company.name || 'My Company',
    email: data.company.email || '',
    phone: data.company.phone || '',
    address: data.company.address || '',
    subscription_plan: 'professional',
    settings: {
      pricing: data.pricing,
      services: data.services.map((s) => s.name).filter(Boolean),
      onboarded_by: userId,
      onboarded_at: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
  }

  if (!DEMO_MODE && supabase) {
    await upsertRows('companies', {
      ...company,
      settings: company.settings as Json,
    })
  } else {
    localStorage.setItem('handymanos_company', JSON.stringify(company))
  }

  for (const emp of data.employees) {
    if (!emp.name) continue
    const employee: Employee = {
      id: crypto.randomUUID(),
      company_id: companyId,
      name: emp.name,
      role: emp.role || 'Technician',
      hourly_wage: emp.hourly_wage ?? 25,
      billing_rate: emp.billing_rate ?? data.pricing.hourly_rate,
      payroll_tax_rate: 0.0765,
      insurance_cost_monthly: 200,
      benefits_monthly: 150,
      overhead_allocation: 0.15,
      is_active: true,
      skills: emp.skills ?? [],
      created_at: new Date().toISOString(),
    }
    await saveEntity('employees', employee)
  }

  for (const veh of data.vehicles) {
    if (!veh.name) continue
    const vehicle: Vehicle = {
      id: crypto.randomUUID(),
      company_id: companyId,
      name: veh.name,
      type: (veh.type as Vehicle['type']) || 'van',
      make: veh.make || '',
      model: veh.model || '',
      license_plate: veh.license_plate || '',
      year: veh.year ?? new Date().getFullYear(),
      mileage: veh.mileage ?? 0,
      is_active: true,
      created_at: new Date().toISOString(),
    }
    await saveEntity('vehicles', vehicle)
  }

  for (const mat of data.materials) {
    if (!mat.name) continue
    const material: Material = {
      id: crypto.randomUUID(),
      company_id: companyId,
      name: mat.name,
      category: mat.category || 'general',
      supplier: mat.supplier || 'Lowes',
      cost: mat.cost ?? 10,
      markup_percent: mat.markup_percent ?? 40,
      customer_price: (mat.cost ?? 10) * (1 + (mat.markup_percent ?? 40) / 100),
      quantity: mat.quantity ?? 10,
      reorder_level: mat.reorder_level ?? 5,
      unit: mat.unit || 'each',
      created_at: new Date().toISOString(),
    }
    await saveEntity('materials', material)
  }

  localStorage.setItem('handymanos_onboarding', 'complete')
  return company
}

export function getStoredCompany(): Company | null {
  try {
    const raw = localStorage.getItem('handymanos_company')
    return raw ? (JSON.parse(raw) as Company) : null
  } catch {
    return null
  }
}
