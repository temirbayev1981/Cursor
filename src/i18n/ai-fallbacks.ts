import type { Locale } from '@/contexts/locale-context'

export interface AIFallbackMessages {
  systemPrompt: string
  systemPromptContextSuffix: string
  businessSnapshot: string
  lostMoney: string
  doorPricing: string
  technicianRanking: string
  profitImprovement: string
  default: string
}

const en: AIFallbackMessages = {
  systemPrompt: 'You are an AI assistant for HandymanOS handyman SaaS. Be concise with numbers and recommendations.',
  systemPromptContextSuffix: '\n\nBusiness data: {context}',
  businessSnapshot:
    'Business snapshot: {customers} customers, {jobs} jobs ({openJobs} open), revenue ${revenue}, profit ${profit}, outstanding invoices ${outstanding}.',
  lostMoney: `Based on this month's data, 2 jobs operated at a loss:

1. **Job #JOB-0087** - Cabinet repair at Oak Lane (-$120, -8.5% margin). Labor ran 3 hours over estimate.
2. **Job #JOB-0091** - Emergency pipe fix (-$45, -3.2% margin). Material costs exceeded estimate.

**Recommendation:** Review cabinet repair estimates — actual hours average 35% above estimate. Consider raising the base price by $75 or adding a complexity surcharge.`,
  doorPricing: `For door replacement/installation, here's my pricing recommendation based on your historical data:

**Standard Interior Door:** $325-$450
- Labor: 2.5-3.5 hours @ $75/hr
- Materials: $80-$150 (door, hinges, trim)

**Exterior Door:** $650-$950
- Labor: 4-6 hours
- Materials: $200-$400

**Your average profit margin on door jobs:** 40.2%
**Suggested price for standard replacement:** $385 (flat rate)

This accounts for your true labor cost of $38/hr and maintains a healthy 42% margin.`,
  technicianRanking: `**Technician Profitability Rankings (This Month):**

1. **James Rodriguez** - $18,500 revenue, 51.6% avg margin, 15 jobs
2. **Marcus Thompson** - $14,200 revenue, 44.0% avg margin, 12 jobs
3. **David Park** - $10,150 revenue, 48.2% avg margin, 10 jobs

James leads in total revenue, but David has the best margin per job. Marcus completes the most jobs per week (3.2 avg).

**Insight:** David's plumbing specialization yields 8% higher margins. Consider cross-training Marcus on plumbing for margin improvement.`,
  profitImprovement: `**Top 5 Profit Improvement Opportunities:**

1. **Reduce estimate variance** - Your actual hours exceed estimates by 18% on average. Tighter scoping could save $2,400/month.

2. **Optimize routing** - Grouping jobs by area could reduce fuel costs by ~$320/month. 3 jobs today are within 2 miles of each other.

3. **Material markup** - Lowes items are marked up 30% vs 45% for specialty items. Standardizing at 40% adds ~$580/month.

4. **Weekend pricing** - You have 4 weekend jobs this month at standard rates. A 1.5x multiplier would add $1,800.

5. **Service catalog adoption** - Jobs using the catalog are 12% more profitable. Encourage catalog-based estimates.`,
  default: `I've analyzed your business data. Here are some quick insights:

- **Monthly revenue:** $42,850 (↑ 4.0% vs last month)
- **Profit margin:** 38.5% (target: 40%)
- **Open jobs:** 3 scheduled, 2 pending estimates
- **Top service:** Electrical (highest margin at 51.6%)

Ask me about specific jobs, pricing, technicians, or strategies to improve profitability.`,
}

const ru: AIFallbackMessages = {
  systemPrompt: 'Ты AI-ассистент для handyman SaaS HandymanOS. Отвечай на русском, кратко и по делу, с цифрами и рекомендациями.',
  systemPromptContextSuffix: '\n\nДанные бизнеса: {context}',
  businessSnapshot:
    'Снимок бизнеса: {customers} клиентов, {jobs} заказов ({openJobs} открытых), выручка ${revenue}, прибыль ${profit}, неоплаченные счета ${outstanding}.',
  lostMoney: `По данным за этот месяц, 2 заказа принесли убыток:

1. **Заказ #JOB-0087** — Ремонт шкафа на Oak Lane (-$120, маржа -8.5%). Трудозатраты превысили смету на 3 часа.
2. **Заказ #JOB-0091** — Срочный ремонт трубы (-$45, маржа -3.2%). Материалы дороже сметы.

**Рекомендация:** Пересмотрите сметы на ремонт шкафов — фактические часы в среднем на 35% выше оценки. Рекомендуем поднять базовую цену на $75 или добавить надбавку за сложность.`,
  doorPricing: `Для замены/установки двери — рекомендация по ценам на основе ваших данных:

**Стандартная межкомнатная дверь:** $325–$450
- Труд: 2.5–3.5 ч @ $75/ч
- Материалы: $80–$150 (дверь, петли, наличники)

**Входная дверь:** $650–$950
- Труд: 4–6 ч
- Материалы: $200–$400

**Средняя маржа по дверям:** 40.2%
**Рекомендуемая цена стандартной замены:** $385 (фикс)

Учитывает реальную стоимость труда $38/ч и маржу 42%.`,
  technicianRanking: `**Рейтинг прибыльности мастеров (этот месяц):**

1. **James Rodriguez** — $18,500 выручки, 51.6% средняя маржа, 15 заказов
2. **Marcus Thompson** — $14,200 выручки, 44.0% маржа, 12 заказов
3. **David Park** — $10,150 выручки, 48.2% маржа, 10 заказов

James лидирует по выручке, но у David лучшая маржа на заказ.

**Инсайт:** Специализация David по сантехнике даёт на 8% выше маржу. Рассмотрите обучение Marcus сантехнике.`,
  profitImprovement: `**Топ-5 возможностей для роста прибыли:**

1. **Снизить расхождение смет** — фактические часы превышают оценку на 18%. Точнее планирование сэкономит ~$2,400/мес.

2. **Оптимизация маршрутов** — группировка заказов по району снизит расходы на топливо на ~$320/мес.

3. **Наценка на материалы** — унификация на 40% добавит ~$580/мес.

4. **Цены в выходные** — 4 заказа в выходные по стандартным ставкам. Множитель 1.5x добавит $1,800.

5. **Каталог услуг** — заказы по каталогу на 12% прибыльнее.`,
  default: `Я проанализировал данные вашего бизнеса:

- **Выручка за месяц:** $42,850 (↑ 4.0% к прошлому месяцу)
- **Маржа прибыли:** 38.5% (цель: 40%)
- **Открытые заказы:** 3 запланированных, 2 ожидающих сметы
- **Топ-услуга:** Электрика (маржа 51.6%)

Спросите о конкретных заказах, ценах, мастерах или стратегиях роста прибыли.`,
}

const messages: Record<Locale, AIFallbackMessages> = { en, ru }

export function getAIFallbacks(locale: Locale): AIFallbackMessages {
  return messages[locale]
}
