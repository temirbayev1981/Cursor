import { hasOpenAI } from '@/lib/env'
import { extractProblemDescription } from '@/lib/vendor-po-parser'
import { callOpenAIProxy } from '@/lib/openai-proxy-client'
import type { VendorPOInput } from '@/types/vendor-po'
import { withTimeout } from '@/lib/with-timeout'

const TRANSLATE_SYSTEM = `You translate vendor work order problem descriptions from English to Russian.
Return ONLY the Russian translation. Keep technical terms clear. Do not add quotes or explanations.`

export const PROBLEM_TRANSLATE_TIMEOUT_MS = 25_000
const FETCH_TIMEOUT_MS = 20_000

export async function translateProblemDescriptionToRussian(text: string): Promise<string | null> {
  const trimmed = text.trim()
  if (!trimmed || !hasOpenAI) return null

  return callOpenAIProxy({
    system: TRANSLATE_SYSTEM,
    user: trimmed.slice(0, 2000),
    model: 'gpt-4o-mini',
    temperature: 0.2,
  }, { timeoutMs: FETCH_TIMEOUT_MS })
}

function needsRussianProblemTranslation(input: VendorPOInput): string | null {
  if (input.problem_description_ru) return null
  const en = input.problem_description || extractProblemDescription(input.service_description)
  if (!en || !/[a-z]/i.test(en)) return null
  return en
}

export async function enrichVendorPOInputWithRussianProblem(input: VendorPOInput): Promise<VendorPOInput> {
  const en = needsRussianProblemTranslation(input)
  if (!en) return input

  try {
    const ru = await withTimeout(
      translateProblemDescriptionToRussian(en),
      PROBLEM_TRANSLATE_TIMEOUT_MS,
      'problem description translation',
    )
    if (ru) return { ...input, problem_description_ru: ru }
  } catch {
    // Skip translation on timeout — lazy translation in table will retry
  }
  return input
}
