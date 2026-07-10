import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  VITE_GOOGLE_MAPS_API_KEY: z.string().optional(),
  VITE_OPENAI_API_KEY: z.string().optional(),
  VITE_OPENAI_PROXY_ENDPOINT: z.string().optional(),
  VITE_STRIPE_CHECKOUT_ENDPOINT: z.string().optional(),
  VITE_STRIPE_SUBSCRIPTION_ENDPOINT: z.string().optional(),
  VITE_NOTIFICATION_WEBHOOK_URL: z.string().optional(),
  VITE_SMS_WEBHOOK_URL: z.string().optional(),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_ERROR_WEBHOOK_URL: z.string().optional(),
})

export const env = envSchema.parse(import.meta.env)

export const hasSupabase = Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY)

/** Playwright E2E only — in-memory Supabase shim (never set in production deploy). */
export const isE2eMockBackend = import.meta.env.VITE_E2E_MOCK_BACKEND === 'true'
export const hasStripe = Boolean(env.VITE_STRIPE_PUBLISHABLE_KEY)
export const hasGoogleMaps = Boolean(env.VITE_GOOGLE_MAPS_API_KEY)
export const hasNotificationWebhook = Boolean(env.VITE_NOTIFICATION_WEBHOOK_URL)
export const hasSms = Boolean(env.VITE_SMS_WEBHOOK_URL) || hasSupabase

export function getOpenAIEndpoint(): string | undefined {
  return env.VITE_OPENAI_PROXY_ENDPOINT
    ?? (hasSupabase ? `${getSupabaseFunctionsUrl()}/openai-proxy` : undefined)
}

/** True when OpenAI proxy (Supabase Edge Function) or legacy browser key is configured */
export const hasOpenAI = Boolean(getOpenAIEndpoint() || env.VITE_OPENAI_API_KEY)

export function getSupabaseFunctionsUrl(): string | null {
  if (!env.VITE_SUPABASE_URL) return null
  return `${env.VITE_SUPABASE_URL}/functions/v1`
}

export function getNotificationEndpoint(): string | undefined {
  if (isE2eMockBackend && !env.VITE_NOTIFICATION_WEBHOOK_URL) return undefined
  return env.VITE_NOTIFICATION_WEBHOOK_URL
    ?? (hasSupabase ? `${getSupabaseFunctionsUrl()}/send-notification` : undefined)
}

export function getSmsEndpoint(): string | undefined {
  if (isE2eMockBackend && !env.VITE_SMS_WEBHOOK_URL) return undefined
  return env.VITE_SMS_WEBHOOK_URL
    ?? (hasSupabase ? `${getSupabaseFunctionsUrl()}/send-sms` : undefined)
}

export const hasNotificationConfigured = Boolean(getNotificationEndpoint())
export const hasSmsConfigured = Boolean(getSmsEndpoint())
export const hasObservability = Boolean(env.VITE_SENTRY_DSN || env.VITE_ERROR_WEBHOOK_URL)

export function getStripeCheckoutEndpoint(): string | undefined {
  return env.VITE_STRIPE_CHECKOUT_ENDPOINT
    ?? (hasSupabase ? `${getSupabaseFunctionsUrl()}/create-checkout-session` : undefined)
}

export function getStripeSubscriptionEndpoint(): string | undefined {
  return env.VITE_STRIPE_SUBSCRIPTION_ENDPOINT
    ?? (hasSupabase ? `${getSupabaseFunctionsUrl()}/create-subscription-checkout` : undefined)
}
