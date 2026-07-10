import type { AIExtractedData } from '@/types'

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
  await new Promise((r) => setTimeout(r, 1500))

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

export async function askBusinessAssistant(question: string, locale: 'ru' | 'en' = 'ru'): Promise<string> {
  await new Promise((r) => setTimeout(r, 1000))

  const q = question.toLowerCase()

  if (locale === 'ru') {
    if (q.includes('убыт') || q.includes('потер') || q.includes('lost money') || q.includes('unprofitable')) {
      return `По данным за этот месяц, 2 заказа принесли убыток:

1. **Заказ #JOB-0087** — Ремонт шкафа на Oak Lane (-$120, маржа -8.5%). Трудозатраты превысили смету на 3 часа.
2. **Заказ #JOB-0091** — Срочный ремонт трубы (-$45, маржа -3.2%). Материалы дороже сметы.

**Рекомендация:** Пересмотрите сметы на ремонт шкафов — фактические часы в среднем на 35% выше оценки. Рекомендуем поднять базовую цену на $75 или добавить надбавку за сложность.`
    }
    if ((q.includes('брать') || q.includes('charge') || q.includes('стоим') || q.includes('цен')) && q.includes('двер')) {
      return `Для замены/установки двери — рекомендация по ценам на основе ваших данных:

**Стандартная межкомнатная дверь:** $325–$450
- Труд: 2.5–3.5 ч @ $75/ч
- Материалы: $80–$150 (дверь, петли, наличники)

**Входная дверь:** $650–$950
- Труд: 4–6 ч
- Материалы: $200–$400

**Средняя маржа по дверям:** 40.2%
**Рекомендуемая цена стандартной замены:** $385 (фикс)

Учитывает реальную стоимость труда $38/ч и маржу 42%.`
    }
    if (q.includes('мастер') || q.includes('техник') || q.includes('technician') || q.includes('profitable')) {
      return `**Рейтинг прибыльности мастеров (этот месяц):**

1. **James Rodriguez** — $18,500 выручки, 51.6% средняя маржа, 15 заказов
2. **Marcus Thompson** — $14,200 выручки, 44.0% маржа, 12 заказов
3. **David Park** — $10,150 выручки, 48.2% маржа, 10 заказов

James лидирует по выручке, но у David лучшая маржа на заказ.

**Инсайт:** Специализация David по сантехнике даёт на 8% выше маржу. Рассмотрите обучение Marcus сантехнике.`
    }
    if (q.includes('прибыл') || q.includes('увелич') || q.includes('increase') || q.includes('improve')) {
      return `**Топ-5 возможностей для роста прибыли:**

1. **Снизить расхождение смет** — фактические часы превышают оценку на 18%. Точнее планирование сэкономит ~$2,400/мес.

2. **Оптимизация маршрутов** — группировка заказов по району снизит расходы на топливо на ~$320/мес.

3. **Наценка на материалы** — унификация на 40% добавит ~$580/мес.

4. **Цены в выходные** — 4 заказа в выходные по стандартным ставкам. Множитель 1.5x добавит $1,800.

5. **Каталог услуг** — заказы по каталогу на 12% прибыльнее.`
    }
    return `Я проанализировал данные вашего бизнеса:

- **Выручка за месяц:** $42,850 (↑ 4.0% к прошлому месяцу)
- **Маржа прибыли:** 38.5% (цель: 40%)
- **Открытые заказы:** 3 запланированных, 2 ожидающих сметы
- **Топ-услуга:** Электрика (маржа 51.6%)

Спросите о конкретных заказах, ценах, мастерах или стратегиях роста прибыли.`
  }

  if (q.includes('lost money') || q.includes('unprofitable')) {
    return `Based on this month's data, 2 jobs operated at a loss:

1. **Job #JOB-0087** - Cabinet repair at Oak Lane (-$120, -8.5% margin). Labor ran 3 hours over estimate.
2. **Job #JOB-0091** - Emergency pipe fix (-$45, -3.2% margin). Material costs exceeded estimate.

**Recommendation:** Review cabinet repair estimates — actual hours average 35% above estimate. Consider raising the base price by $75 or adding a complexity surcharge.`
  }

  if (q.includes('charge') && q.includes('door')) {
    return `For door replacement/installation, here's my pricing recommendation based on your historical data:

**Standard Interior Door:** $325-$450
- Labor: 2.5-3.5 hours @ $75/hr
- Materials: $80-$150 (door, hinges, trim)

**Exterior Door:** $650-$950
- Labor: 4-6 hours
- Materials: $200-$400

**Your average profit margin on door jobs:** 40.2%
**Suggested price for standard replacement:** $385 (flat rate)

This accounts for your true labor cost of $38/hr and maintains a healthy 42% margin.`
  }

  if (q.includes('technician') && q.includes('profitable')) {
    return `**Technician Profitability Rankings (This Month):**

1. **James Rodriguez** - $18,500 revenue, 51.6% avg margin, 15 jobs
2. **Marcus Thompson** - $14,200 revenue, 44.0% avg margin, 12 jobs
3. **David Park** - $10,150 revenue, 48.2% avg margin, 10 jobs

James leads in total revenue, but David has the best margin per job. Marcus completes the most jobs per week (3.2 avg).

**Insight:** David's plumbing specialization yields 8% higher margins. Consider cross-training Marcus on plumbing for margin improvement.`
  }

  if (q.includes('increase profit') || q.includes('improve')) {
    return `**Top 5 Profit Improvement Opportunities:**

1. **Reduce estimate variance** - Your actual hours exceed estimates by 18% on average. Tighter scoping could save $2,400/month.

2. **Optimize routing** - Grouping jobs by area could reduce fuel costs by ~$320/month. 3 jobs today are within 2 miles of each other.

3. **Material markup** - Lowes items are marked up 30% vs 45% for specialty items. Standardizing at 40% adds ~$580/month.

4. **Weekend pricing** - You have 4 weekend jobs this month at standard rates. A 1.5x multiplier would add $1,800.

5. **Service catalog adoption** - Jobs using the catalog are 12% more profitable. Encourage catalog-based estimates.`
  }

  return `I've analyzed your business data. Here are some quick insights:

- **Monthly revenue:** $42,850 (↑ 4.0% vs last month)
- **Profit margin:** 38.5% (target: 40%)
- **Open jobs:** 3 scheduled, 2 pending estimates
- **Top service:** Electrical (highest margin at 51.6%)

Ask me about specific jobs, pricing, technicians, or strategies to improve profitability.`
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
