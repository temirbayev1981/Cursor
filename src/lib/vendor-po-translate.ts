import { hasOpenAI, getOpenAIEndpoint } from '@/lib/env'
import { getSupabaseAuthHeaders } from '@/lib/supabase'

const TRANSLATE_SYSTEM = `You translate vendor work order problem descriptions from English to Russian.
Return ONLY the Russian translation. Keep technical terms clear. Do not add quotes or explanations.`

export async function translateProblemDescriptionToRussian(text: string): Promise<string | null> {
  const trimmed = text.trim()
  if (!trimmed || !hasOpenAI) return null

  const proxyEndpoint = getOpenAIEndpoint()
  if (!proxyEndpoint) return null

  try {
    const headers = await getSupabaseAuthHeaders()
    const res = await fetch(proxyEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        system: TRANSLATE_SYSTEM,
        user: trimmed.slice(0, 2000),
        model: 'gpt-4o-mini',
        temperature: 0.2,
      }),
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
