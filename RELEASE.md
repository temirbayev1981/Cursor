# HandymanOS AI — Release 1.9.1

**Status:** merged to `main` (tags **`v1.7.4`**–**`v1.9.1`**, current package **1.9.1**).

Consolidated **1.7.x** production release + **1.8.0** audit milestone.

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

### 1.7.5 — Post-release ops
- POST_RELEASE.md checklist; deploy.yml dynamic `VITE_APP_VERSION`

### 1.7.6 — Smoke & Stripe audit
- Extended `smoke:supabase` (tables + RPCs); `supabase/UPGRADE.md`
- Stripe webhook writes `invoice.payment` audit log
- `release.yml` workflow on git tags

### 1.7.7 — Subscription audit & CI smoke
- Stripe webhook writes `billing.plan_upgrade` audit on SaaS subscription checkout
- Platform audit: `stripe_webhook_audit` quality gate
- `SMOKE_OPTIONAL=1` for CI; `check_rate_limit` RPC in smoke script

### 1.7.8 — Integration probes & audit
- Settings → Integrations: async live endpoint probes (Live / Unreachable)
- Expanded audit: customer create/update, invoice from estimate, job status change

### 1.7.9 — Audit E2E
- E2E coverage for new audit actions (customer, invoice, job status)
- Audit log `data-audit-action` selectors; probes skipped in E2E mock

### 1.7.10 — Field ops audit
- Audit: job create/update, schedule from job, estimate sent
- Platform audit `audit_i18n` gate (28+ localized actions)

### 1.8.0 — Inventory audit milestone
- Audit: stock receive, materials applied to job
- Platform audit `inventory_audit` gate; **32** localized audit actions
- E2E: schedule, inventory receive/apply → audit log

### 1.8.1 — Catalog & onboarding audit
- Audit: material/property CRUD, owner onboarding complete
- Platform audit `onboarding_audit` gate; **37** localized audit actions
- E2E: material create, onboarding wizard → audit log

### 1.8.2 — Fleet audit & coverage summary
- Audit: employee/vehicle CRUD
- Platform audit `fleet_audit` gate; **41** localized audit actions
- Settings audit log header: unique action types vs localized label count
- E2E: employee create, vehicle create, coverage summary

### 1.8.3 — Expense audit
- Audit: expense create/update
- Platform audit `expense_audit` gate; **43** localized audit actions
- E2E: expense create → audit log

### 1.8.4 — Fuel log & dispatch audit
- `FuelLogForm` + `useSaveFuelLog`; dispatch audit gate
- Platform audit `fuel_log_audit`, `dispatch_audit` gates; **45** localized audit actions
- E2E: fuel log create, dispatch status change → audit log

### 1.8.5 — Vendor PO & company profile audit
- Platform audit `vendor_po_audit`, `company_profile_audit` gates
- E2E: vendor PO → job, emergency alert, company profile update → audit log

### 1.8.6 — Portal & tenant audit
- Platform audit `portal_audit`, `company_switch_audit`, `invite_audit` gates
- E2E: portal estimate approve, invoice payment, company switch, invite accept → audit log

### 1.8.7 — Bulk & billing audit
- Platform audit `bulk_ops_audit`, `billing_plan_audit`, `team_invite_audit` gates
- E2E: bulk cancel/assign, plan upgrade, team invite → audit log

### 1.8.8 — Invoice & portal requests audit
- Platform audit `invoice_audit`, `sample_import_audit`, `portal_requests_audit` gates
- E2E: invoice payment/sent, sample import, portal review/job submit → audit log

### 1.8.9 — Full audit E2E milestone
- Platform audit `estimate_create_audit`, `entity_update_audit`, `audit_e2e_full` gates
- Vendor PO workflow logs `estimate.create`; entity edit UI for update audit paths
- E2E: all **44** localized audit actions covered in `audit-expanded.spec.ts`

### 1.9.0 — Production readiness visibility
- Platform audit checklist on Settings → System; probe-aware health scores
- Maps live probe; `integration_probes` gate; honest PWA/offline checks
- `verify:production` enforces audit E2E invariants

### 1.9.1 — Observability & edge smoke
- Observability probe (`VITE_ERROR_WEBHOOK_URL`); Settings → Integrations card
- Platform audit `observability_probe_audit` gate; probe-aware observability health
- `SMOKE_EDGE_FUNCTIONS=1` edge function smoke in `supabase-smoke.mjs`
- E2E: integrations cards including observability; platform audit checklist

## Test coverage

- Unit: **122** (`npm test`)
- E2E: **185/185** (`npm run test:e2e`)

## Deploy

```bash
# Required in .env.local or GitHub Secrets
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

npm run verify:production
npm run test
npm run test:e2e
npm run smoke:supabase   # optional, live Supabase
```

Push to `main` triggers GitHub Pages deploy. See [POST_RELEASE.md](./POST_RELEASE.md) for the operator checklist.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for secrets, Edge Functions, and schema setup.

## Merge chain

`#63` (1.7.0) → `#64` (1.7.1) → `#65` (1.7.2) → `#66` (1.7.3) → `#67` (1.7.4) → `#68` (docs) — **merged to `main`**
