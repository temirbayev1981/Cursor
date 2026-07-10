# HandymanOS AI — Release 1.3.0

Consolidated release for Phases **36–41** (July 2026).

## Highlights

| Area | Deliverables |
|------|----------------|
| **PWA & performance** | Bundle splitting (~176 KB main chunk), service worker v2, PWA E2E |
| **Field ops / offline** | Full technician offline E2E (notes, clock-in/out, complete job); 5 action types unit-tested |
| **Dispatch** | Status select on kanban cards; SMS + email notification E2E |
| **Reliability** | Error boundary E2E; portal invalid/expired token paths; observability tests |
| **Notifications** | Notification bell panel E2E; `notification-service` unit tests |
| **CI / deploy** | `verify:production` on deploy; auto-gate all E2E specs; optional Supabase smoke workflow |

## Test coverage

- **Unit:** 80 tests
- **E2E:** 34 tests across 11 spec files
- **Gate:** `npm run verify:production`

## Upgrade from 1.2.x

```bash
npm run verify:production
npm run test:e2e
```

No new schema changes since 1.2.0. Re-apply `supabase/schema.sql` if upgrading from < 1.2.0.

## GitHub secrets (production)

| Secret | Purpose |
|--------|---------|
| `VITE_SUPABASE_URL` | Live backend |
| `VITE_SUPABASE_ANON_KEY` | Supabase client |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Payments |
| `VITE_NOTIFICATION_WEBHOOK_URL` | Email |
| `VITE_SMS_WEBHOOK_URL` | SMS dispatch |
| `VITE_SENTRY_DSN` | Error monitoring |

Without Supabase secrets, GitHub Pages deploys in **demo mode**.

## Optional: live Supabase smoke

After configuring secrets, run **Actions → Supabase smoke → Run workflow** to verify REST API connectivity.

## Deploy

```bash
git checkout main
git merge cursor/phase-41-release-130-1b4a
git push origin main
```

Merge to `main` triggers GitHub Pages deploy with `VITE_APP_VERSION: 1.3.0`.

## Open PR merge chain

`#24` → `#25` → … → `#33` → **#34** (this release)

Or merge `cursor/phase-41-release-130-1b4a` directly for the full stack.
