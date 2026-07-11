import type { AIExtractedData } from '@/types'
import { hasOpenAI, env, getOpenAIEndpoint, isE2eMockBackend } from '@/lib/env'
import { getSupabaseAuthHeaders } from '@/lib/supabase'
import { getAIFallbacks } from '@/i18n/ai-fallbacks'
import type { Locale } from '@/contexts/locale-context'

const REPAIR_PATTERNS: Record<string, { tasks: string[]; materials: string[]; hours: number }> = {
  drywall: {
    tasks: ['Assess damage', 'Cut and patch drywall', 'Apply joint compound', 'Sand and prime', 'Paint repaired area'],
    materials: ['Drywall sheet', 'Joint compound', 'Sandpaper', 'Primer', 'Paint'],
    hours: 4,
  },
  paint: {
    tasks: ['Prepare surfaces', 'Tape and protect', 'Apply primer', 'Paint walls', 'Clean up'],
    materials: ['Paint', 'Primer', 'Tape', 'Drop cloths', 'Brushes'],
    hours: 6,
  },
  faucet: {
    tasks: ['Diagnose leak', 'Shut off water supply', 'Replace cartridge/seals', 'Test and inspect'],
    materials: ['Faucet cartridge kit', 'Plumber tape', 'Supply lines'],
    hours: 2,
  },
  door: {
    tasks: ['Remove old door/trim', 'Install new door', 'Hang and align', 'Install trim', 'Hardware installation'],
    materials: ['Door', 'Hinges', 'Trim', 'Shims', 'Screws'],
    hours: 3,
  },
  electrical: {
    tasks: ['Inspect panel', 'Identify issues', 'Repair/replace components', 'Test circuits', 'Document work'],
    materials: ['Breakers', 'Wire', 'Connectors', 'Outlet covers'],
    hours: 6,
  },
  trim: {
    tasks: ['Measure and cut', 'Remove old trim', 'Install new trim', 'Caulk and fill', 'Paint/finish'],
    materials: ['Trim boards', 'Nails', 'Wood filler', 'Caulk', 'Paint'],
    hours: 3,
  },
}

async function callOpenAI(systemPrompt: string, userContent: string): Promise<string | null> {
  if (!hasOpenAI) return null

  const proxyEndpoint = getOpenAIEndpoint()

  try {
    if (proxyEndpoint) {
      const headers = await getSupabaseAuthHeaders()
      const res = await fetch(proxyEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          system: systemPrompt,
          user: userContent.slice(0, 8000),
          model: 'gpt-4o-mini',
          temperature: 0.3,
        }),
      })
      if (!res.ok) return null
      const json = await res.json() as { content?: string | null }
      return json.content ?? null
    }

    if (!isE2eMockBackend) return null
    const legacyKey = env.VITE_OPENAI_API_KEY
    if (!legacyKey) return null

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${legacyKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
      }),
    })
    if (!res.ok) return null
    const json = await res.json() as { choices?: { message?: { content?: string } }[] }
    return json.choices?.[0]?.message?.content ?? null
  } catch {
    return null
  }
}

const EXTRACT_SYSTEM = `You are a handyman work order parser. Extract structured data from work order text.
Return valid JSON only with keys: customer, property, job, tasks, estimate.
customer: {name, phone, email, address}
property: {property_type, unit_number, location}
job: {requested_repairs[], required_materials[], estimated_labor_hours, priority, special_instructions}
tasks: string[]
estimate: {labor_hours, materials[], suggested_price_min, suggested_price_max}`

async function parseWithOpenAI(content: string): Promise<AIExtractedData | null> {
  const raw = await callOpenAI(EXTRACT_SYSTEM, content.slice(0, 8000))
  if (!raw) return null
  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned) as AIExtractedData
  } catch {
    return null
  }
}

function detectRepairTypes(text: string): string[] {
  const lower = text.toLowerCase()
  const detected: string[] = []
  if (lower.includes('drywall')) detected.push('drywall')
  if (lower.includes('paint')) detected.push('paint')
  if (lower.includes('faucet') || lower.includes('leak') || lower.includes('plumb')) detected.push('faucet')
  if (lower.includes('door')) detected.push('door')
  if (lower.includes('electrical') || lower.includes('outlet') || lower.includes('panel')) detected.push('electrical')
  if (lower.includes('trim')) detected.push('trim')
  if (detected.length === 0) detected.push('drywall')
  return detected
}

function extractAddress(text: string): string | undefined {
  const match = text.match(/\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Lane|Ln|Drive|Dr|Road|Rd)[\w\s,]*/i)
  return match?.[0]
}

function extractPhone(text: string): string | undefined {
  const match = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
  return match?.[0]
}

function extractEmail(text: string): string | undefined {
  const match = text.match(/[\w.-]+@[\w.-]+\.\w+/)
  return match?.[0]
}

export async function analyzeWorkOrderPDF(content: string): Promise<AIExtractedData> {
  const aiResult = await parseWithOpenAI(content)
  if (aiResult) return aiResult

  await new Promise((r) => setTimeout(r, 800))

  const repairs = content
    .split(/[.,;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5)

  const types = detectRepairTypes(content)
  const allTasks: string[] = []
  const allMaterials: string[] = []
  let totalHours = 0

  for (const type of types) {
    const pattern = REPAIR_PATTERNS[type]
    if (pattern) {
      allTasks.push(...pattern.tasks.slice(0, 2))
      allMaterials.push(...pattern.materials)
      totalHours += pattern.hours
    }
  }

  const hourlyRate = 75
  const materialCost = allMaterials.length * 25
  const laborCost = totalHours * hourlyRate
  const suggestedMin = Math.round((laborCost + materialCost) * 0.9)
  const suggestedMax = Math.round((laborCost + materialCost) * 1.3)

  return {
    customer: {
      name: extractEmail(content) ? undefined : 'ABC Property Management',
      phone: extractPhone(content),
      email: extractEmail(content),
      address: extractAddress(content),
    },
    property: {
      property_type: content.toLowerCase().includes('unit') ? 'apartment' : 'single_family',
      unit_number: content.match(/unit\s*#?\s*(\w+)/i)?.[1],
      location: extractAddress(content),
    },
    job: {
      requested_repairs: repairs.length > 0 ? repairs : [content],
      required_materials: [...new Set(allMaterials)],
      estimated_labor_hours: totalHours,
      priority: content.toLowerCase().includes('emergency') || content.toLowerCase().includes('asap') ? 'high' : 'medium',
      special_instructions: content.toLowerCase().includes('tenant') ? 'Tenant-occupied unit. Coordinate access.' : undefined,
    },
    tasks: allTasks.length > 0 ? allTasks : ['Assess and repair'],
    estimate: {
      labor_hours: totalHours,
      materials: [...new Set(allMaterials)],
      suggested_price_min: suggestedMin,
      suggested_price_max: suggestedMax,
    },
  }
}

export async function analyzeEmailWorkOrder(emailContent: string): Promise<AIExtractedData> {
  await new Promise((r) => setTimeout(r, 1200))
  return analyzeWorkOrderPDF(emailContent)
}

export async function analyzePhoto(_file: File): Promise<AIExtractedData> {
  await new Promise((r) => setTimeout(r, 2000))

  return {
    job: {
      requested_repairs: ['Wall damage detected - approximately 2ft x 1.5ft area'],
      required_materials: ['Drywall patch', 'Joint compound', 'Sandpaper', 'Primer', 'Paint (color match)'],
      estimated_labor_hours: 4,
      priority: 'medium',
    },
    tasks: ['Cut damaged drywall section', 'Install patch', 'Mud and sand', 'Prime and paint'],
    estimate: {
      labor_hours: 4,
      materials: ['Drywall patch', 'Joint compound', 'Sandpaper', 'Primer', 'Paint'],
      suggested_price_min: 350,
      suggested_price_max: 550,
    },
  }
}

export function buildBusinessContext(
  data: {
    jobs: import('@/types').Job[]
    invoices: import('@/types').Invoice[]
    customers: import('@/types').Customer[]
  },
  locale: Locale = 'en',
): string {
  const revenue = data.jobs.reduce((s, j) => s + j.revenue, 0)
  const profit = data.jobs.reduce((s, j) => s + j.profit, 0)
  const openJobs = data.jobs.filter((j) => !['completed', 'cancelled'].includes(j.status)).length
  const outstanding = data.invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + (i.total - i.amount_paid), 0)
  const { businessSnapshot } = getAIFallbacks(locale)
  return businessSnapshot
    .replace('{customers}', String(data.customers.length))
    .replace('{jobs}', String(data.jobs.length))
    .replace('{openJobs}', String(openJobs))
    .replace('{revenue}', revenue.toFixed(0))
    .replace('{profit}', profit.toFixed(0))
    .replace('{outstanding}', outstanding.toFixed(0))
}

export async function askBusinessAssistant(
  question: string,
  locale: Locale = 'ru',
  businessContext?: string
): Promise<string> {
  const fallbacks = getAIFallbacks(locale)
  const systemPrompt = businessContext
    ? fallbacks.systemPrompt + fallbacks.systemPromptContextSuffix.replace('{context}', businessContext)
    : fallbacks.systemPrompt

  const aiAnswer = await callOpenAI(systemPrompt, question)
  if (aiAnswer) return aiAnswer

  await new Promise((r) => setTimeout(r, 600))

  const q = question.toLowerCase()

  if (locale === 'ru') {
    if (q.includes('убыт') || q.includes('потер') || q.includes('lost money') || q.includes('unprofitable')) {
      return fallbacks.lostMoney
    }
    if ((q.includes('брать') || q.includes('charge') || q.includes('стоим') || q.includes('цен')) && q.includes('двер')) {
      return fallbacks.doorPricing
    }
    if (q.includes('мастер') || q.includes('техник') || q.includes('technician') || q.includes('profitable')) {
      return fallbacks.technicianRanking
    }
    if (q.includes('прибыл') || q.includes('увелич') || q.includes('increase') || q.includes('improve')) {
      return fallbacks.profitImprovement
    }
    return fallbacks.default
  }

  if (q.includes('lost money') || q.includes('unprofitable')) {
    return fallbacks.lostMoney
  }

  if (q.includes('charge') && q.includes('door')) {
    return fallbacks.doorPricing
  }

  if (q.includes('technician') && q.includes('profitable')) {
    return fallbacks.technicianRanking
  }

  if (q.includes('increase profit') || q.includes('improve')) {
    return fallbacks.profitImprovement
  }

  return fallbacks.default
}

export function generateSmartEstimate(
  _serviceName: string,
  historicalJobs: { estimated_hours: number; actual_hours: number; revenue: number; profit_margin: number }[]
): { hours: number; price: number; confidence: number } {
  const serviceJobs = historicalJobs
  if (serviceJobs.length === 0) {
    return { hours: 4, price: 450, confidence: 0.5 }
  }

  const avgActualHours = serviceJobs.reduce((s, j) => s + j.actual_hours, 0) / serviceJobs.length
  const avgMargin = serviceJobs.reduce((s, j) => s + j.profit_margin, 0) / serviceJobs.length
  const hours = Math.ceil(avgActualHours * 1.05)
  const price = Math.round(hours * 75 * (1 + (100 - avgMargin) / 100))

  return {
    hours,
    price,
    confidence: Math.min(0.95, 0.5 + serviceJobs.length * 0.1),
  }
}
