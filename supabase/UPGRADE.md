# Supabase schema upgrades

HandymanOS AI ships a single canonical schema: [`schema.sql`](./schema.sql).  
For existing projects, **re-run the full file** in the Supabase SQL Editor (idempotent `CREATE OR REPLACE` / `IF NOT EXISTS` where possible).

## Fresh install

1. Create a Supabase project
2. Paste and run **`schema.sql`** entirely
3. Deploy Edge Functions (see [DEPLOYMENT.md](../DEPLOYMENT.md))
4. Verify:

```bash
npm run smoke:supabase
```

## From 1.6.x → 1.7.x

**Breaking:** frontend requires Supabase env vars; demo/offline mode removed.

1. Re-run **`schema.sql`** (ensures portal RPCs, `team_invites`, `customer_reviews`, `company_members`, `vendor_po_records`, `audit_logs`)
2. Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in hosting and GitHub Secrets
3. Redeploy Edge Functions
4. Run `npm run smoke:supabase` — checks tables + RPCs

## From 1.7.0–1.7.4 → 1.7.5+

No schema changes required. Update frontend deploy and optional:

- `npm run smoke:supabase` (expanded table/RPC checks)
- Stripe webhook redeploy if using `stripe-webhook` audit logging

## From 1.10.4 → 1.10.5

No schema changes. E2E for portal → staff CRM notification preference sync.

## From 1.10.3 → 1.10.4

No schema changes. E2E coverage for skipped notification toasts and CRM ↔ portal prefs sync.

## From 1.10.2 → 1.10.3

No schema changes. Staff customer form edits `customers.notification_preferences` (column already exists from 1.10.0).

## From 1.10.1 → 1.10.2

No schema changes. Estimate/invoice sends respect customer email opt-out.

## From 1.10.0 → 1.10.1

1. Re-run **`schema.sql`** (adds portal notification preference RPCs)
2. Redeploy frontend (portal prefs sync, scheduling locale dates)

## From 1.9.5 → 1.10.0

Schema additions for operator tooling and customer notification prefs:

1. Re-run **`schema.sql`** (adds `integration_probe_runs` table + `customers.notification_preferences` JSONB)
2. Redeploy frontend (notification hub, dispatch bulk SMS, portal prefs)
3. Optional: `npm run verify:operator` with `VITE_SUPABASE_*` and `SMOKE_EDGE_FUNCTIONS=1` in CI

## From 1.9.4 → 1.9.5

No schema changes. Locale-aware notifications; observability probe gate fix; notification flush in Settings.

## From 1.9.3 → 1.9.4

No schema changes. Integration probe history panel in Settings → System.

## From 1.9.2 → 1.9.3

No schema changes. Integration probe UI with live badges and refresh in Settings → Integrations.

## From 1.9.1 → 1.9.2

No schema changes. Sentry DSN observability probe; async service worker registration for offline gate.

## From 1.9.0 → 1.9.1

No schema changes. Observability integration probe; optional `SMOKE_EDGE_FUNCTIONS=1` edge function smoke.

## From 1.8.9 → 1.9.0

No schema changes. Platform audit checklist, probe-aware health, PWA manifest link.

## From 1.8.8 → 1.8.9

No schema changes. Full audit E2E coverage (44 actions); entity edit UI; platform audit gates.

## From 1.8.7 → 1.8.8

No schema changes. Invoice, sample import, and portal request audit E2E.

## From 1.8.6 → 1.8.7

No schema changes. Bulk ops and billing/team audit E2E; platform audit gates.

## From 1.8.5 → 1.8.6

No schema changes. Portal and tenant audit E2E; platform audit gates.

## From 1.8.4 → 1.8.5

No schema changes. Vendor PO and company profile audit E2E; platform audit gates.

## From 1.8.3 → 1.8.4

No schema changes. Fuel log form, fuel log audit logging, dispatch audit gate.

## From 1.8.2 → 1.8.3

No schema changes. Expense create/update audit logging.

## From 1.8.1 → 1.8.2

No schema changes. Employee/vehicle audit logging and audit coverage summary UI.

## From 1.8.0 → 1.8.1

No schema changes. Material/property CRUD and onboarding audit logging.

## From 1.7.10 → 1.8.0

No schema changes. Inventory audit logging (`inventory.receive`, `inventory.apply`).

## From 1.7.9 → 1.7.10+

No schema changes. Expanded audit logging for jobs, schedules, estimates.

## From 1.7.8 → 1.7.9+

No schema changes. E2E and audit UI test ids only.

## From 1.7.7 → 1.7.8+

No schema changes. Frontend-only: integration probes and expanded audit logging.

## From 1.7.5–1.7.6 → 1.7.7+

No schema changes. Redeploy **`stripe-webhook`** Edge Function for subscription audit logging (`billing.plan_upgrade`).

## Smoke script coverage

`npm run smoke:supabase` validates:

| Type | Objects |
|------|---------|
| Tables | `companies`, `profiles`, `company_members`, `team_invites`, `portal_tokens`, `audit_logs`, `customer_reviews`, `vendor_po_records` |
| RPCs | `check_rate_limit`, `validate_portal_token`, `get_accessible_companies`, `get_team_invite`, `get_portal_estimates`, `portal_submit_review` |

Set `SMOKE_OPTIONAL=1` to skip gracefully when credentials are unset (CI).

A **404** on any object means `schema.sql` was not applied or is incomplete.

## Rollback

Schema rollback is manual — restore from a Supabase backup or re-apply a known-good `schema.sql` from git tag (e.g. `v1.7.4`).
