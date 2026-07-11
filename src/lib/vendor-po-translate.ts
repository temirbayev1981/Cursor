import { hasOpenAI, getOpenAIEndpoint } from '@/lib/env'
import { extractProblemDescription } from '@/lib/vendor-po-parser'
import { getSupabaseAuthHeaders } from '@/lib/supabase'
import type { VendorPOInput } from '@/types/vendor-po'
import { fetchWithTimeout, withTimeout } from '@/lib/with-timeout'

const TRANSLATE_SYSTEM = `You translate vendor work order problem descriptions from English to Russian.
Return ONLY the Russian translation. Keep technical terms clear. Do not add quotes or explanations.`

export const PROBLEM_TRANSLATE_TIMEOUT_MS = 25_000
const FETCH_TIMEOUT_MS = 20_000

export async function translateProblemDescriptionToRussian(text: string): Promise<string | null> {
  const trimmed = text.trim()
  if (!trimmed || !hasOpenAI) return null

  const proxyEndpoint = getOpenAIEndpoint()
  if (!proxyEndpoint) return null

  try {
    const headers = await getSupabaseAuthHeaders()
    const res = await fetchWithTimeout(proxyEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        system: TRANSLATE_SYSTEM,
        user: trimmed.slice(0, 2000),
        model: 'gpt-4o-mini',
        temperature: 0.2,
      }),
      timeoutMs: FETCH_TIMEOUT_MS,
    })
    if (!res.ok) return null
    const json = await res.json() as { content?: unknown }
    const content = json.content
    if (typeof content === 'string') return content.trim() || null
    return null
  } catch {
    return null
  }
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
