# HandymanOS AI — Release 1.2.7

Technician offline sync completion on **1.2.6**.

## What's new in 1.2.7

- E2E: clock-out and complete-job offline flows sync when reconnected (29 tests total)
- All five offline action types now have unit test coverage
- `syncOfflineQueue` partial-failure behavior tested
- Job notes dialog and tech mobile connection badge accessibility improvements

## Prior releases (1.2.6)

- Dispatch board status select + notification E2E
- `notification-service` unit tests (8 tests)

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

# Merge to main triggers deploy workflow
git checkout main
git merge cursor/phase-39-tech-offline-complete-1b4a
git push origin main
```

## Merge chain (open PRs)

`#24` → … → `#31` → **#32**

Or merge `cursor/phase-39-tech-offline-complete-1b4a` directly for the complete feature set.
