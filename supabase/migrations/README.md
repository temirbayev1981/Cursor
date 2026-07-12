# Supabase migrations

HandymanOS AI uses **versioned SQL migrations** for incremental database changes.

## Fresh install

Run the full canonical schema (not migrations alone):

1. [`schema.sql`](./schema.sql) — complete idempotent schema (`SCHEMA_VERSION: 2026-07-11d`)
2. Deploy Edge Functions — see [DEPLOYMENT.md](../DEPLOYMENT.md)

## Incremental upgrades

Apply migrations in order via Supabase SQL Editor or Supabase CLI:

| Migration | Purpose |
|-----------|---------|
| `20260711000001_auth_provision_owner.sql` | Auth login fix: `handle_new_user`, `provision_owner_company`, profile backfill |
| `20260711000002_check_rate_limit.sql` | Edge Function rate limiting (`check_rate_limit`, `rate_limit_buckets`) |
| `20260711000003_vendor_po_problem_description.sql` | Vendor PO problem description columns (`problem_description`, `problem_description_ru`) |
| `20260712000001_rate_limit_buckets_rls.sql` | Enable RLS on `rate_limit_buckets` (service_role only via SECURITY DEFINER) |

After each migration, verify:

```bash
npm run smoke:supabase
```

## Supabase CLI (optional)

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

For existing projects that already ran `schema.sql`, apply only **new** migration files you have not run yet.

## Canonical schema

`schema.sql` remains the single source of truth for fresh installs. Migrations capture **delta** changes for production databases that cannot be rebuilt from scratch.
