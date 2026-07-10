# HandymanOS AI — Production Deployment

## 1. Supabase Database

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run the full schema:

```bash
# File: supabase/schema.sql
```

3. Enable **Email** auth provider under Authentication → Providers
4. Copy project URL and anon key to `.env`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

5. In the app: **Settings → System → Import sample data** to seed customers, jobs, estimates, and invoices into Supabase.

### Hybrid offline cache

When Supabase is configured, reads are mirrored to `localStorage` for PWA/offline resilience. Writes update both Supabase and the local cache. If the network fails, the app falls back to cached data.

### Upgrading from 1.1.x → 1.2.x

Re-run the full `supabase/schema.sql` in the SQL Editor. New objects include:

- Portal RPCs (`get_portal_*`, `portal_submit_review`, …)
- `rate_limit_buckets` + `check_rate_limit` for Edge Functions
- `company_members` + `get_accessible_companies` for multi-company switcher
- `customer_reviews` for portal feedback
- Private storage bucket policies for `handymanos`

Then redeploy all Edge Functions (see section 2).

### Upgrading to 1.7.x (production-only)

1.7.0 removes demo/offline mode — **Supabase is required** (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`).
Re-run `supabase/schema.sql` if upgrading from 1.6.x (portal RPCs, `team_invites`, `customer_reviews` unchanged but verify objects exist).

After deploy:

```bash
npm run verify:production
npm run test:e2e   # 138 tests across 30 spec files
npm run smoke:supabase   # optional, needs live Supabase env
```

**1.7.x highlights:** portal RPC-only security, localized platform audit & audit log (Settings → System), 138/138 E2E with mock backend, manual invoice pay when Stripe key is unset.

Merge stacked PRs in order — see [MERGE.md](./MERGE.md).

### Upgrading from 1.2.0 → 1.2.2

No schema changes required. Frontend-only release (i18n, AI fallbacks, invite sign-in fix). Run:

```bash
npm run verify:production
npm run test:e2e   # 137 tests (see e2e/*.spec.ts)
```

Merge to `main` to redeploy GitHub Pages with `VITE_APP_VERSION` from the release branch.

---

## 2. Stripe Checkout (Edge Function)

### Deploy

```bash
# Install Supabase CLI: https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_live_...

# Deploy function
supabase functions deploy create-checkout-session
```

### Configure frontend

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_CHECKOUT_ENDPOINT=https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-checkout-session
```

The Edge Function template lives at `supabase/functions/create-checkout-session/index.ts`. It creates a Stripe Checkout session and returns `{ sessionId }` for `StripePayButton`.

### Stripe webhook (auto-mark invoices paid)

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...  # service role, auto-injected in hosted Supabase
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy create-subscription-checkout
```

In Stripe Dashboard → Webhooks, point to:
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`

Events: `checkout.session.completed` (handles invoice payments and SaaS subscription upgrades)

### SaaS subscription billing

Settings → Billing uses `create-subscription-checkout` for Starter ($49), Professional ($99), Enterprise ($199) plans.

Without Stripe keys, plan upgrades are unavailable — configure Stripe Checkout for SaaS billing.

```bash
supabase functions deploy create-subscription-checkout
```

---

## 3. SMS (Twilio Edge Function)

```bash
supabase secrets set TWILIO_ACCOUNT_SID=AC...
supabase secrets set TWILIO_AUTH_TOKEN=...
supabase secrets set TWILIO_PHONE_NUMBER=+1...
supabase functions deploy send-sms
```

When `VITE_SUPABASE_URL` is set, the app auto-routes SMS to:
`{SUPABASE_URL}/functions/v1/send-sms`

Or override with `VITE_SMS_WEBHOOK_URL`.

SMS is triggered when dispatch moves a job to **scheduled**.

---

## 4. Storage (photos & documents)

The schema creates a `handymanos` storage bucket with company-scoped RLS policies.

Technician mobile app uploads job photos via `storage-service.ts` to the Supabase `handymanos` bucket.

Ensure the bucket exists after running `schema.sql` (Storage section at end of file).

---

## 5. Email (Resend Edge Function)

```bash
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set RESEND_FROM_EMAIL="HandymanOS <billing@yourdomain.com>"
supabase functions deploy send-notification
```

When Supabase is configured, email notifications auto-route to:
`{SUPABASE_URL}/functions/v1/send-notification`

Or override with `VITE_NOTIFICATION_WEBHOOK_URL`.

Payload:

```json
{
  "to": "customer@example.com",
  "subject": "Смета: Bathroom Repair",
  "body": "...",
  "channel": "email"
}
```

Without a webhook, notifications queue in `localStorage` (Settings → System).

---

## 6. OpenAI proxy (Edge Function)

Keeps the OpenAI API key server-side. Do **not** set `VITE_OPENAI_API_KEY` in production.

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase functions deploy openai-proxy
```

When Supabase is configured, the app auto-routes AI requests to:
`{SUPABASE_URL}/functions/v1/openai-proxy`

Requires an authenticated Supabase session (JWT). Legacy `VITE_OPENAI_API_KEY` in the browser is not recommended for production.

---

## 7. Portal magic links

Generate links from **Customers** page (link icon) or via `createPortalLink` service.

- Customer portal: `/portal/access?token=...` → redirects to `/portal/customer`
- Property manager portal: same flow with `portal_type: property`

Tokens are stored in `portal_tokens` (7-day expiry) in Supabase.

---

## 8. Team invites

**Settings → Team** — invite by email and role. Link format:
`/login?invite=TOKEN`

- **New users:** sign up via the invite link (role and company applied automatically).
- **Existing users:** open the same link, switch to **Sign In**, and log in — membership is added via `acceptInviteForCurrentUser` + `company_members`.

---

## 9. Production auth flow

1. User signs up → `registerUserWithCompany` creates auth user, company, and owner profile
2. SQL trigger `handle_new_user` ensures a profile row exists as fallback
3. User completes 6-step onboarding → company settings saved with `onboarded_at`
4. Sign-in restores session from Supabase `profiles` + `companies`

---

## 10. Optional integrations

| Variable | Service |
|----------|---------|
| `VITE_OPENAI_PROXY_ENDPOINT` | Override OpenAI Edge Function URL |
| `VITE_OPENAI_API_KEY` | Legacy browser-side OpenAI (not recommended) |
| `VITE_GOOGLE_MAPS_API_KEY` | Dispatch map & route links |
| `VITE_SENTRY_DSN` | Error monitoring |
| `VITE_ERROR_WEBHOOK_URL` | Custom error webhook fallback |

### GitHub Actions secrets (GitHub Pages deploy)

| Secret | Required | Purpose |
|--------|----------|---------|
| `VITE_SUPABASE_URL` | Recommended | Live Supabase project |
| `VITE_SUPABASE_ANON_KEY` | Recommended | Supabase anon key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Optional | Stripe.js |
| `VITE_STRIPE_CHECKOUT_ENDPOINT` | Optional | Invoice checkout function URL |
| `VITE_STRIPE_SUBSCRIPTION_ENDPOINT` | Optional | SaaS subscription checkout URL |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | Maps embed |
| `VITE_NOTIFICATION_WEBHOOK_URL` | Optional | Override email function URL |
| `VITE_SMS_WEBHOOK_URL` | Optional | Override SMS function URL |
| `VITE_SENTRY_DSN` | Optional | Sentry browser SDK |
| `VITE_ERROR_WEBHOOK_URL` | Optional | Custom error reporting |

See [RELEASE.md](./RELEASE.md) for the full checklist.

---

## 11. Build & deploy frontend

### GitHub Pages (automated)

Push to `main` triggers `.github/workflows/deploy.yml`. Configure repository secrets (see [RELEASE.md](./RELEASE.md)):

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — live backend
- `VITE_STRIPE_PUBLISHABLE_KEY` — payments
- Optional: maps, notifications, SMS, Sentry

`VITE_BASE_PATH` is set automatically to `/{repo-name}/` for project pages.

### Manual deploy

```bash
npm run verify:production
npm run verify:release
npm run test:e2e
npm run build
# Deploy dist/ to Vercel, Netlify, Cloudflare Pages, etc.
```

Set all `VITE_*` env vars in your hosting provider.

---

## 12. E2E tests (CI)

```bash
npm run test:e2e
```

Playwright builds the app, runs **138 tests** across 30 spec files against `http://127.0.0.1:4173` (in-memory Supabase mock).

### Optional: live Supabase smoke

When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured as GitHub secrets:

```bash
npm run smoke:supabase
# or: Actions → Supabase smoke → Run workflow
```

Validates REST connectivity, `validate_portal_token` RPC, and `get_accessible_companies` RPC (re-apply `schema.sql` if RPC checks fail).

---

## 13. PWA

Service worker (`public/sw.js`) is registered in production builds. Ensure your host serves `/sw.js` and `/manifest.json` with correct cache headers.

---

## Checklist

- [ ] `npm run verify:production` passes locally
- [ ] `supabase/schema.sql` applied
- [ ] Sample data imported via Settings → System (or real data entered)
- [ ] Stripe Edge Function deployed + `VITE_STRIPE_CHECKOUT_ENDPOINT` set
- [ ] `stripe-webhook` deployed + Stripe webhook configured
- [ ] `send-sms` deployed with Twilio secrets (or custom `VITE_SMS_WEBHOOK_URL`)
- [ ] `send-notification` deployed with Resend (or custom `VITE_NOTIFICATION_WEBHOOK_URL`)
- [ ] `openai-proxy` deployed with `OPENAI_API_KEY` secret
- [ ] `portal_tokens` / `team_invites` tables applied (in schema.sql)
- [ ] `npm run test:e2e` passes in CI
