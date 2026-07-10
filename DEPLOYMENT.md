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

### Optional webhook

For automatic invoice status updates after payment, add a Stripe webhook endpoint (separate Edge Function or server) listening for `checkout.session.completed` and updating the `invoices` table.

---

## 3. SMS (Twilio via webhook)

HandymanOS sends SMS by POSTing to `VITE_SMS_WEBHOOK_URL`. Implement a small serverless handler:

```json
POST /sms
{ "to": "+15551234567", "body": "Новый заказ: ...", "provider": "twilio" }
```

Example (Node/Express + Twilio):

```js
app.post('/sms', async (req, res) => {
  const { to, body } = req.body
  await twilioClient.messages.create({ to, from: process.env.TWILIO_FROM, body })
  res.json({ ok: true })
})
```

```env
VITE_SMS_WEBHOOK_URL=https://your-api.com/sms
```

SMS is triggered when:
- Dispatch moves a job to **scheduled** (technician notification)
- Future: customer appointment reminders

---

## 4. Email notifications

```env
VITE_NOTIFICATION_WEBHOOK_URL=https://your-api.com/notify
```

Payload:

```json
{
  "to": "customer@example.com",
  "subject": "Смета: Bathroom Repair",
  "body": "...",
  "channel": "email",
  "metadata": { "type": "estimate_sent" }
}
```

Without a webhook, notifications are queued in `localStorage` (visible in **Settings → System**).

---

## 5. Optional integrations

| Variable | Service |
|----------|---------|
| `VITE_OPENAI_API_KEY` | AI work order parsing & assistant |
| `VITE_GOOGLE_MAPS_API_KEY` | Dispatch map & route links |
| `VITE_SENTRY_DSN` | Error monitoring |

---

## 6. Build & deploy frontend

```bash
npm run build
# Deploy dist/ to Vercel, Netlify, Cloudflare Pages, etc.
```

Set all `VITE_*` env vars in your hosting provider.

---

## 7. E2E tests (CI)

```bash
npm run test:e2e
```

Playwright builds the app, runs smoke tests and portal tests against `http://127.0.0.1:4173`.

---

## 8. PWA

Service worker (`public/sw.js`) is registered in production builds. Ensure your host serves `/sw.js` and `/manifest.json` with correct cache headers.

---

## Checklist

- [ ] `supabase/schema.sql` applied
- [ ] Demo data imported (or real data entered)
- [ ] Stripe Edge Function deployed + `VITE_STRIPE_CHECKOUT_ENDPOINT` set
- [ ] SMS webhook deployed + `VITE_SMS_WEBHOOK_URL` set
- [ ] Email webhook (optional) + `VITE_NOTIFICATION_WEBHOOK_URL` set
- [ ] Frontend deployed with all env vars
- [ ] `npm run test:e2e` passes in CI
