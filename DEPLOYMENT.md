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

5. In the app: **Settings → System → Import demo data** to seed customers, jobs, estimates, and invoices into Supabase.

### Hybrid offline cache

When Supabase is configured, reads are mirrored to `localStorage` for PWA/offline resilience. Writes update both Supabase and the local cache. If the network fails, the app falls back to cached data.

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
```

In Stripe Dashboard → Webhooks, point to:
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`

Events: `checkout.session.completed`

The webhook updates `invoices` and inserts into `payments` using the service role.

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

## 4. Email (Resend Edge Function)

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

## 5. OpenAI proxy (Edge Function)

Keeps the OpenAI API key server-side. Do **not** set `VITE_OPENAI_API_KEY` in production.

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase functions deploy openai-proxy
```

When Supabase is configured, the app auto-routes AI requests to:
`{SUPABASE_URL}/functions/v1/openai-proxy`

Requires an authenticated Supabase session (JWT). Legacy `VITE_OPENAI_API_KEY` still works in demo/dev but is not recommended.

---

## 6. Portal magic links

Generate links from **Customers** page (link icon) or via `createPortalLink` service.

- Customer portal: `/portal/access?token=...` → redirects to `/portal/customer`
- Property manager portal: same flow with `portal_type: property`

Tokens are stored in `portal_tokens` (7-day expiry). Demo mode uses localStorage.

---

## 7. Team invites

**Settings → Team** — invite by email and role. Link format:
`/login?invite=TOKEN`

On signup, the user joins the existing company with the invited role (`team_invites` table).

---

## 8. Production auth flow

1. User signs up → `registerUserWithCompany` creates auth user, company, and owner profile
2. SQL trigger `handle_new_user` ensures a profile row exists as fallback
3. User completes 6-step onboarding → company settings saved with `onboarded_at`
4. Sign-in restores session from Supabase `profiles` + `companies`

---

## 9. Optional integrations

| Variable | Service |
|----------|---------|
| `VITE_OPENAI_PROXY_ENDPOINT` | Override OpenAI Edge Function URL |
| `VITE_OPENAI_API_KEY` | Legacy browser-side OpenAI (not recommended) |
| `VITE_GOOGLE_MAPS_API_KEY` | Dispatch map & route links |
| `VITE_SENTRY_DSN` | Error monitoring |

---

## 10. Build & deploy frontend

```bash
npm run build
# Deploy dist/ to Vercel, Netlify, Cloudflare Pages, etc.
```

Set all `VITE_*` env vars in your hosting provider.

---

## 11. E2E tests (CI)

```bash
npm run test:e2e
```

Playwright builds the app, runs smoke tests and portal tests against `http://127.0.0.1:4173`.

---

## 12. PWA

Service worker (`public/sw.js`) is registered in production builds. Ensure your host serves `/sw.js` and `/manifest.json` with correct cache headers.

---

## Checklist

- [ ] `supabase/schema.sql` applied
- [ ] Demo data imported (or real data entered)
- [ ] Stripe Edge Function deployed + `VITE_STRIPE_CHECKOUT_ENDPOINT` set
- [ ] `stripe-webhook` deployed + Stripe webhook configured
- [ ] `send-sms` deployed with Twilio secrets (or custom `VITE_SMS_WEBHOOK_URL`)
- [ ] `send-notification` deployed with Resend (or custom `VITE_NOTIFICATION_WEBHOOK_URL`)
- [ ] `openai-proxy` deployed with `OPENAI_API_KEY` secret
- [ ] `portal_tokens` / `team_invites` tables applied (in schema.sql)
- [ ] `npm run test:e2e` passes in CI
