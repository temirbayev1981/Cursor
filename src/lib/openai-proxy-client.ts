import { hasOpenAI, getOpenAIEndpoint, isE2eMockBackend, env } from '@/lib/env'
import { getSupabaseAuthHeaders, supabase } from '@/lib/supabase'
import { ensureSupabaseSession, hasSupabaseInvokeSupport } from '@/lib/supabase-session'
import { getErrorMessage } from '@/lib/error-message'
import { fetchWithTimeout, withTimeout } from '@/lib/with-timeout'

export type OpenAIProxyRequest = {
  system: string
  user: string
  model?: string
  temperature?: number
  images?: string[]
}

const DEFAULT_TIMEOUT_MS = 20_000

function parseProxyPayload(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const payload = data as { content?: unknown; error?: unknown }
  if (typeof payload.error === 'string' && payload.error) {
    console.warn('openai-proxy error:', payload.error)
    return null
  }
  if (typeof payload.content === 'string') return payload.content.trim() || null
  return null
}

async function invokeOpenAIProxy(
  request: OpenAIProxyRequest,
  timeoutMs: number,
): Promise<string | null> {
  if (!hasSupabaseInvokeSupport()) return null
  if (!await ensureSupabaseSession()) return null

  try {
    const { data, error } = await withTimeout(
      supabase!.functions.invoke('openai-proxy', { body: request }),
      timeoutMs,
      'openai-proxy invoke',
    )
    if (error) {
      console.warn('openai-proxy invoke failed:', getErrorMessage(error))
      return null
    }
    return parseProxyPayload(data)
  } catch (err) {
    console.warn('openai-proxy invoke exception:', getErrorMessage(err))
    return null
  }
}

async function fetchOpenAIProxy(
  request: OpenAIProxyRequest,
  timeoutMs: number,
): Promise<string | null> {
  const proxyEndpoint = getOpenAIEndpoint()
  if (!proxyEndpoint) return null

  try {
    const headers = await getSupabaseAuthHeaders()
    const res = await fetchWithTimeout(proxyEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
      timeoutMs,
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.warn(`openai-proxy HTTP ${res.status}:`, body.slice(0, 200))
      return null
    }
    const json = await res.json() as unknown
    return parseProxyPayload(json)
  } catch (err) {
    console.warn('openai-proxy fetch exception:', getErrorMessage(err))
    return null
  }
}

export async function callOpenAIProxy(
  request: OpenAIProxyRequest,
  options?: { timeoutMs?: number },
): Promise<string | null> {
  if (!hasOpenAI) return null

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const normalized = {
    model: 'gpt-4o-mini',
    temperature: 0.3,
    ...request,
  }

  const viaInvoke = await invokeOpenAIProxy(normalized, timeoutMs)
  if (viaInvoke) return viaInvoke

  if (isE2eMockBackend && env.VITE_OPENAI_API_KEY) {
    return fetchOpenAIProxy(normalized, timeoutMs)
  }

  return fetchOpenAIProxy(normalized, timeoutMs)
}
