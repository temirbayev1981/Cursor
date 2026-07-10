# Post-release checklist (1.7.4+)

Use this after merging to `main` or cutting a new tag.

## 1. GitHub repository secrets

In **Settings → Secrets and variables → Actions**, set at minimum:

| Secret | Required | Purpose |
|--------|----------|---------|
| `VITE_SUPABASE_URL` | Yes | Live Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Anon key for frontend + smoke |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Optional | Stripe Checkout button |
| `VITE_STRIPE_CHECKOUT_ENDPOINT` | Optional | Edge Function URL |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | Dispatch map |
| `VITE_SENTRY_DSN` | Optional | Error monitoring |

Without Supabase secrets, the **Deploy** workflow still passes (E2E uses mock backend), but the live site shows `SupabaseRequiredScreen`.

## 2. Supabase project

1. Create project at [supabase.com](https://supabase.com)
2. Run full `supabase/schema.sql` in SQL Editor (see [supabase/UPGRADE.md](./supabase/UPGRADE.md) for version paths)
3. Deploy Edge Functions (see [DEPLOYMENT.md](./DEPLOYMENT.md) §2–8)
4. Set Edge Function secrets (`OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, etc.)

## 3. Verify locally

```bash
npm ci
cp .env.example .env.local   # fill VITE_SUPABASE_* 
npm run verify:production
npm run test:e2e
npm run smoke:supabase       # needs live Supabase in .env.local
```

## 4. CI / GitHub Pages

- Push to `main` runs **Deploy** workflow (verify → lint → test → E2E → Pages)
- **Supabase smoke** runs in Deploy when secrets are set (`SMOKE_OPTIONAL=1`, `continue-on-error: true`)
- Manual smoke: **Actions → Supabase smoke → Run workflow**

## 5. First login in production

1. Open deployed GitHub Pages URL
2. Sign up or sign in with Supabase Auth
3. Complete onboarding wizard (owner) or accept team invite
4. Optional: **Settings → System → Import sample data**

## 6. Platform audit

**Settings → System** — aim for score ≥ 8.5 with live integrations connected.

## 7. Tags and rollback

Current release tag: **`v1.8.6`**

```bash
git tag -a v1.8.7 -m "HandymanOS AI 1.8.7"
git push origin v1.8.7
```

Rollback: `git checkout v1.8.6` or reset `main` to a prior tag (team policy).

## 8. Close stale PRs

Stacked PRs #63–#71 are merged to `main`. Only unrelated drafts (e.g. #61 INSTRUCTIONS.md) may remain open — close or merge separately.
