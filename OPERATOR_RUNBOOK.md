# Operator Runbook — Production 10/10

HandymanOS AI production URL: https://handy.readyfixnc.com/

Run automated checks after every deploy:

```bash
npm run verify:operator:prod
```

## 1. Supabase

1. Apply `supabase/schema.sql` on fresh projects, or incremental files in `supabase/migrations/`.
2. **Required migrations** (SQL Editor, in order):
   - `supabase/migrations/20260711000001_auth_provision_owner.sql` — if login/signup fails
   - `supabase/migrations/20260711000002_check_rate_limit.sql` — if `supabase-smoke` reports missing `check_rate_limit`
3. GitHub Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (for strict smoke checks).

## 2. Edge Functions

```bash
npm run deploy:edge-functions
```

Functions: `create-checkout-session`, `create-subscription-checkout`, `openai-proxy`, `send-notification`, `send-sms`, `stripe-webhook`.

Set secrets in Supabase dashboard: `OPENAI_API_KEY`, Stripe keys, email/SMS provider keys.

## 3. FTP deploy (handy.readyfixnc.com)

GitHub Secrets: `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`. Push to `main` triggers `.github/workflows/deploy.yml`.

## 4. Optional integrations

| Integration | Env / secret | Notes |
|-------------|--------------|-------|
| Stripe | `VITE_STRIPE_PUBLISHABLE_KEY` + webhook | Online invoice payments |
| Email | `send-notification` + Resend or webhook | Customer notifications |
| SMS | `send-sms` + Twilio or webhook | Dispatch / invoice SMS |
| OpenAI | `openai-proxy` + `OPENAI_API_KEY` | AI parsing + **scanned Vendor PO OCR** |
| Google Maps | `VITE_GOOGLE_MAPS_API_KEY` | Dispatch map |
| Observability | `VITE_SENTRY_DSN` or `VITE_ERROR_WEBHOOK_URL` | Error monitoring |

## 5. In-app verification

1. **Settings → Integrations → Refresh probes** — all configured integrations should show **Live**.
2. **Settings → System → Platform Audit** — score ≥ 9.
3. **Work Orders → Vendor PO** — upload text PDF and scanned PDF; OCR fallback should extract PO text.
4. **Customers / Jobs / Invoices** — table pagination loads pages from Supabase (not only client slice).

## 6. CI gates

```bash
npm run verify:production   # release + file gates
npm run test:e2e            # mock backend E2E
```

Nightly workflow runs `verify:operator` when Supabase secrets are set.
