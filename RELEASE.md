# HandymanOS AI — Release 1.2.2

Consolidates Phases 31–33 (i18n polish, AI fallbacks, vendor PO).

## What's included

Everything from **1.2.1**, plus:

- Login i18n, invite sign-in race fix, platform audit multi-tenant gate
- `useDateLocale` hook; settings/route optimizer/toast i18n
- AI assistant fallback responses externalized (`src/i18n/ai-fallbacks.ts`)
- Vendor PO table: compliance checklist, job creation toasts (EN/RU)
- `npm run verify:production` readiness script
- CI: lint, unit tests, E2E (Playwright), GitHub Pages deploy

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
git merge cursor/phase-33-ai-vendor-i18n-1b4a
git push origin main
```

## Post-deploy verification

1. Open GitHub Pages URL (Settings → Pages)
2. Sign in — demo mode works without credentials
3. With Supabase: register owner → onboarding → Settings → System (audit ≥ 8.5)
4. Customer portal: approve estimate, pay invoice, submit review
5. Property portal: submit maintenance request
6. AI Assistant: suggested questions return localized fallback answers
7. Work Orders → Vendor PO: compliance checklist in selected locale
8. Language switcher: dashboard title updates RU ↔ EN

## Version history

See [CHANGELOG.md](./CHANGELOG.md).
