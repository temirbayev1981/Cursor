interface RateBucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateBucket>()

export interface RateLimitResult {
  ok: boolean
  retryAfter?: number
}

export function checkRateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000,
  now = Date.now(),
): RateLimitResult {
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

export function rateLimitResponse(retryAfter: number) {
  return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfter),
    },
  })
}
