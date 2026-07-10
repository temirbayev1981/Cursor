# HandymanOS AI — Release 1.7.4

**Status:** merged to `main` and tagged **`v1.7.4`** (2026-07-10).

Consolidated **1.7.x** production release (stacked PRs #63–#68).

## What's new since 1.6.4

### 1.7.0 — Production-only
- **Supabase required** — `DEMO_MODE` removed; `SupabaseRequiredScreen` when env vars missing
- E2E/Vitest use in-memory Supabase mock (`VITE_E2E_MOCK_BACKEND`)
- **Import sample data** in Settings → System

### 1.7.1 — Audit P2
- Portal RPC-only (no localStorage bypass on fetch or token validation)
- Platform audit i18n; notification queue affects system metrics

### 1.7.2 — Audit P3
- Expanded `logAudit`: bulk cancel, invoice pay/send, company profile, portal actions
- Portal hooks RPC-only (no `saveEntity` fallback)

### 1.7.3 — E2E green
- **138/138** Playwright tests passing
- E2E mock composite upsert fix; manual portal pay without Stripe key

### 1.7.4 — Audit P4 & release sync
- Localized audit log labels (EN/RU) in Settings → System
- Additional audit events: bulk assign/schedule, sample import, plan upgrade, portal invoice payment
- `deploy.yml` `VITE_APP_VERSION` synced with `package.json`

## Test coverage

- Unit: **99+** (`npm test`)
- E2E: **138/138** (`npm run test:e2e`)

## Deploy

```bash
# Required
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

npm run verify:production
npm run test
npm run test:e2e

git checkout main
# Merge chain: #63 → #64 → #65 → #66 → #67
git push origin main
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for secrets, Edge Functions, and schema setup.

See [MERGE.md](./MERGE.md) for merging the stacked PR chain into `main`.

## Merge chain

`#63` (1.7.0) → `#64` (1.7.1) → `#65` (1.7.2) → `#66` (1.7.3) → `#67` (1.7.4) → `#68` (docs) — **merged to `main`**
