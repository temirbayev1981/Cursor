# HandymanOS AI — Release 1.2.5

Technician offline sync E2E on **1.2.4**.

## What's new in 1.2.5

- E2E: technician mobile offline notes save → queue → online sync (25 tests total)
- E2E: clock-in offline → queue → sync when reconnected
- Unit tests for `clock_in` and `update_job` offline actions
- Shared Playwright helpers for offline simulation

## Prior releases (1.2.4)

- Vite bundle splitting: main chunk ~176 KB (was ~569 KB)
- Service worker cache `handymanos-v2`
- E2E: PWA manifest + service worker registration
- Unit tests for offline queue

## GitHub repository secrets (production deploy)

Configure under **Settings → Secrets and variables → Actions**:

| Secret | Required | Purpose |
|--------|----------|---------|
| `VITE_SUPABASE_URL` | Recommended | Live backend |
| `VITE_SUPABASE_ANON_KEY` | Recommended | Supabase client |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Optional | Online payments |
| `VITE_STRIPE_CHECKOUT_ENDPOINT` | Optional | Override checkout URL |
| `VITE_STRIPE_SUBSCRIPTION_ENDPOINT` | Optional | Override subscription URL |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | Dispatch maps |
| `VITE_NOTIFICATION_WEBHOOK_URL` | Optional | Email notifications |
| `VITE_SMS_WEBHOOK_URL` | Optional | SMS dispatch alerts |
| `VITE_SENTRY_DSN` | Optional | Error monitoring (Sentry SDK) |
| `VITE_ERROR_WEBHOOK_URL` | Optional | Custom error webhook fallback |

Without Supabase secrets, GitHub Pages deploys in **demo mode** (fully functional offline).

## Release checklist

```bash
npm run verify:production
npm run verify:release
npm run test:e2e

# Supabase backend — re-apply full schema after upgrade:
# supabase/schema.sql (portal RPCs, rate limits, company_members, customer_reviews)

# Deploy Edge Functions:
supabase functions deploy create-checkout-session
supabase functions deploy create-subscription-checkout
supabase functions deploy openai-proxy
supabase functions deploy send-notification
supabase functions deploy send-sms
supabase functions deploy stripe-webhook --no-verify-jwt

# Merge to main triggers deploy workflow
git checkout main
git merge cursor/phase-37-tech-offline-e2e-1b4a
git push origin main
```

## Merge chain (open PRs)

For full stack from Phase 31 onward:

`#24` → `#25` → `#26` → `#27` → `#28` → `#29` → `#30`

Or merge `cursor/phase-37-tech-offline-e2e-1b4a` directly for the complete feature set.

## Post-deploy verification

1. Open GitHub Pages URL — login works in demo mode
2. `/tech` — offline badge, pending sync, notes save
3. Settings → System — platform audit score visible
4. Customer portal link from job detail works
