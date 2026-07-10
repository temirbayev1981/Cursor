# HandymanOS AI — Release 1.1.0

Production-ready SaaS platform consolidating Phases 8–24.

## What's included

- Full feature platform (dashboard, jobs, dispatch, scheduling, mobile tech, reports, analytics)
- Supabase auth, RLS, typed data layer, team invites, portals
- Platform health + audit score in Settings → System
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
| `VITE_SENTRY_DSN` | Optional | Error monitoring |

Without Supabase secrets, GitHub Pages deploys in **demo mode** (fully functional offline).

## Release checklist

```bash
# Local verification
npm run verify:release
npm run test:e2e

# Supabase backend
# 1. Apply supabase/schema.sql
# 2. Deploy Edge Functions (see DEPLOYMENT.md)
# 3. Import demo data via Settings → System

# Merge to main triggers deploy workflow
git checkout main
git merge cursor/phase-24-release-consolidation-1b4a
git push origin main
```

## Post-deploy verification

1. Open GitHub Pages URL (Settings → Pages)
2. Sign in — demo mode works without credentials
3. With Supabase configured: register owner → complete onboarding
4. Settings → System: platform audit score ≥ 8.5 when integrations are live
5. Run invite flow → `/tech-onboarding` → `/tech` mobile view

## Version history

See [CHANGELOG.md](./CHANGELOG.md).
