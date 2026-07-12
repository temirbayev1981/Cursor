import { test, expect } from '@playwright/test'

const hasSupabaseCreds = Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY)
const hasStripeKey = Boolean(process.env.VITE_STRIPE_PUBLISHABLE_KEY)
const skipLive = !hasSupabaseCreds || !hasStripeKey

function functionsBaseUrl(): string {
  const url = process.env.VITE_SUPABASE_URL!.replace(/\/$/, '')
  return `${url}/functions/v1`
}

test.describe('Stripe live smoke', () => {
  test.skip(skipLive, 'VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_STRIPE_PUBLISHABLE_KEY required')

  test('create-subscription-checkout edge is deployed (rejects unauthenticated POST)', async ({ request }) => {
    const res = await request.post(`${functionsBaseUrl()}/create-subscription-checkout`, {
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.VITE_SUPABASE_ANON_KEY!,
      },
      data: {
        plan: 'enterprise',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      },
    })

    expect(res.status(), await res.text()).toBeGreaterThanOrEqual(400)
    expect(res.status()).toBeLessThan(500)
  })
})
