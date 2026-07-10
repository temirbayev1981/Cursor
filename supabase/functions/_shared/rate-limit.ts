import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

interface RateBucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateBucket>()

export interface RateLimitResult {
  ok: boolean
  retryAfter?: number
}

export function clientRateLimitKey(req: Request, userId: string): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('cf-connecting-ip')
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'
  return `${userId}:${ip}`
}

let serviceClient: SupabaseClient | null = null

function getServiceClient(): SupabaseClient | null {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return null
  if (!serviceClient) {
    serviceClient = createClient(supabaseUrl, serviceKey)
  }
  return serviceClient
}

function checkRateLimitMemory(
  key: string,
  limit = 30,
  windowMs = 60_000,
  now = Date.now(),
): RateLimitResult {
  for (const [bucketKey, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(bucketKey)
  }

  const bucket = buckets.get(key)
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
  }

  bucket.count += 1
  return { ok: true }
}

export async function checkRateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  const client = getServiceClient()
  if (client) {
    const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))
    const { data, error } = await client.rpc('check_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })

    if (!error && data && typeof data === 'object') {
      const result = data as { ok?: boolean; retry_after?: number }
      if (result.ok === false) {
        return { ok: false, retryAfter: result.retry_after ?? windowSeconds }
      }
      if (result.ok === true) return { ok: true }
    }
  }

  return checkRateLimitMemory(key, limit, windowMs)
}

export function rateLimitResponse(retryAfter: number) {
  return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfter),
    },
  })
}
