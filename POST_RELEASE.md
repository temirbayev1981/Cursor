# Post-release checklist (1.14.26+)

Use this after merging to `main` or cutting a new tag.

## 1. GitHub repository secrets

In **Settings → Secrets and variables → Actions**, set at minimum:

| Secret | Required | Purpose |
|--------|----------|---------|
| `VITE_SUPABASE_URL` | Yes | Live Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Anon key for frontend + smoke |
| `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD` | For FTP deploy | Production at custom subdomain (e.g. handy.readyfixnc.com) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Optional | Stripe Checkout button |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | Dispatch map |
| `VITE_SENTRY_DSN` | Optional | Error monitoring |

Without Supabase secrets, CI still passes (E2E uses mock backend), but the live site shows `SupabaseRequiredScreen`.

## 2. Supabase project

1. Create project at [supabase.com](https://supabase.com)
2. Run full `supabase/schema.sql` in SQL Editor (see [supabase/UPGRADE.md](./supabase/UPGRADE.md))
3. **Auth fix (if login fails):** run `supabase/migrations/20260711000001_auth_provision_owner.sql`
4. **Vendor PO + RLS (if needed):** run `20260711000003_vendor_po_problem_description.sql`, `20260712000001_rate_limit_buckets_rls.sql`
5. Deploy Edge Functions:

```bash
npm run deploy:edge-functions
# or see DEPLOYMENT.md §2–8
```

6. Set Edge Function secrets (`OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, etc.)

## 3. Verify locally

```bash
npm ci
cp .env.example .env.local   # fill VITE_SUPABASE_*
npm run verify:production
npm run verify:operator
npm run test
npm run test:e2e
npm run smoke:supabase       # needs live Supabase in .env.local
```

## 4. CI / deploy

- Push to `main` runs **CI**, **Deploy** (GitHub Pages), and **Deploy FTP** (when FTP secrets are set)
- **Supabase smoke** runs nightly (`supabase-smoke.yml` at 06:00 UTC)
- **Live E2E smoke** runs nightly (`nightly-live-e2e.yml` at 07:00 UTC) when Supabase secrets are set; optional Stripe edge probe when `VITE_STRIPE_PUBLISHABLE_KEY` is set

## 5. First login in production

1. Open production URL (e.g. https://handy.readyfixnc.com/)
2. Sign up or sign in with Supabase Auth
3. Complete owner onboarding or accept team invite
4. Optional: **Settings → System → Import sample data**
5. User guide: **Settings → System → User guide** (`/instructions`) — RU/EN by app locale

## 6. Platform audit

**Settings → System** — aim for score ≥ 8.5 with live integrations connected. Run `npm run verify:operator` after deploy.

## 7. Tags and rollback

Current release: **1.14.29**

```bash
git tag -a v1.14.29 -m "HandymanOS AI 1.14.29"
git push origin v1.14.29
```

Rollback: checkout a prior tag per team policy.

## 8. Documentation

- **RU:** `INSTRUCTIONS.md` / `public/INSTRUCTIONS.md`
- **EN:** `INSTRUCTIONS.en.md` / `public/INSTRUCTIONS.en.md`
- Operator deploy: [DEPLOY-FTP.md](./DEPLOY-FTP.md), [DEPLOYMENT.md](./DEPLOYMENT.md)
