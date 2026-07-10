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
