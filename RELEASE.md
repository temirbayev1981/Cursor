# HandymanOS AI — Release 1.7.0

Production-only release on **1.6.4**.

## What's new in 1.7.0

- **Supabase required** — no offline demo mode; configuration screen when env vars are missing
- Real Supabase auth only (sign in / sign up / session restore)
- E2E and unit tests use in-memory Supabase mock (`src/lib/e2e-mock-supabase.ts`)
- Removed demo login hints, portal bypass, billing without Stripe, and sidebar demo banner
- **Import sample data** in Settings → System (optional seed into live database)
- Notification queue uses `queued` status instead of demo flag

## Test coverage

- Unit: **87**
- E2E: run `npm run test:e2e` (Playwright builds with mock backend)

## Deploy

```bash
# Required in .env.local or GitHub Actions secrets
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

npm run verify:production
npm run test
npm run test:e2e

git checkout main
git merge cursor/remove-demo-production-only-1b4a
git push origin main
```

## Merge chain

`#50` → … → `#62` (1.6.4) → **this release** (1.7.0)
