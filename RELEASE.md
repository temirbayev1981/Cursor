# HandymanOS AI — Release 1.14.36

**Status:** PR [#182](https://github.com/temirbayev1981/Cursor/pull/182) (`cursor/audit-p4-bundle-mobile-1b4a`) — not merged; production on **1.14.24**.

Audit P4 milestone: mobile-first list layouts, bundle splitting, E2E visibility stability.

## 1.14.25–1.14.36 — Audit P4 (bundle + mobile + E2E)

### Bundle splitting (lazy chunks)
- **v1.14.25** — Dynamic `e2e-mock-supabase`; async bootstrap in `main.tsx`
- **v1.14.29** — Dynamic `pdf-ocr` in `pdf-extract.ts`
- **v1.14.30** — Dynamic `mock-data` in `importSampleData`
- **v1.14.31** — `pdf-utils.ts`; work-orders lazy `pdf-extract` (~584→97 kB chunk)
- **v1.14.33** — Work-orders lazy `@/lib/ai` on analyze
- **v1.14.34** — Estimates lazy `generateSmartEstimate` when smart engine opens
- **v1.14.35** — Invoices/estimates/reports lazy `@/lib/export` on PDF/CSV export
- **v1.14.36** — Vendor PO lazy export; AI assistant lazy `@/lib/ai` on send; `vendor-po-groups.ts` + `ai-context.ts`

### Mobile cards (dual layout)
Jobs, customers, vendor PO, invoices, estimates, materials, expenses, vehicles (fuel logs), reports (profit + customers tabs) — `md:hidden` cards + `hidden md:block` tables.

### E2E stability
- `e2e/helpers/visibility.ts` — visible locators (`visibleText`, `visibleTestId`, `visibleRow`, etc.)
- **14** mobile-layout specs gated in `verify-production-readiness`
- `mobile-smoke.spec.ts` refreshed for iPhone 13
- `stripe-live.spec.ts` nightly edge probe

### Test coverage (target)
- Unit: `npm test`
- E2E: `npm run test:e2e`
- Gates: `npm run verify:production`

---

# HandymanOS AI — Release 1.13.5

**Status:** merged to `main` (current package **1.13.5**).

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
- Platform audit `fuel_log_audit`, `dispatch_audit` gates; **44** localized audit actions
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

### 1.9.2 — Sentry probe & PWA offline gate
- Observability probe also checks `VITE_SENTRY_DSN` ingest host
- Async service worker registration; honest offline_sync requires active SW
- Platform audit `pwa_sw_offline_audit` gate; Settings refreshes on SW ready

### 1.9.3 — Integration probe UI
- Live probe badges in Settings → Integrations (production + E2E synthetic probes)
- Probe summary banner and refresh button
- Platform audit `integration_probe_ui_audit` gate

### 1.9.4 — Probe history dashboard
- Settings → System stores last 10 integration probe runs
- Per-run summary and per-integration status badges
- Platform audit `integration_probe_history_audit` gate

### 1.9.5 — System audit fixes
- Locale-aware notification templates; observability probe gate uses live results
- Notification queue flush in Settings; RU audit checklist translations
- Docs: **44** audit actions (historical correction)

### 1.13.4 — Lazy recharts & live E2E
- Dashboard/reports lazy-load recharts chunks (smaller initial bundle)
- Nightly `nightly-live-e2e.yml` smoke against live Supabase when secrets are set

### 1.13.3 — Chart prefetch & registry E2E sync
- Prefetch recharts/dashboard/reports on app shell load
- Registry keys must match audit-expanded E2E coverage 1:1
- Nightly smoke runs operator readiness when secrets are set

### 1.13.2 — Lazy chunks & audit action registry
- PDF and Excel libraries load on demand (smaller initial bundle)
- `audit-action-registry.ts` centralizes all audit action keys

### 1.13.1 — CI E2E sharding & Supabase smoke
- Playwright E2E sharded across 4 parallel CI jobs
- Supabase smoke on `main` push + nightly cron; deploy smoke fails on live errors

### 1.13.0 — Field-ops milestone wrap-up
- `FIELD_OPS_MILESTONE_AUDIT` computed from core sub-gates (inventory, fleet, expense, fuel, dispatch, offline sync)
- Settings exposes `stripe_webhook_audit` and `audit_i18n` checks
- verify-production split: core field-ops vs platform-ops visibility

### 1.12.6 — Sample import, portal requests, estimate & entity audit visibility
- Settings exposes `sample_import_audit`, `portal_requests_audit`, `estimate_create_audit`, `entity_update_audit`
- verify-production gates for remaining platform audit E2E coverage

### 1.12.5 — Billing, team invite & invoice audit visibility
- Settings exposes `billing_plan_audit`, `team_invite_audit`, `invoice_audit` platform checks
- verify-production gates for billing plan upgrade, team invite sent, and invoice payment E2E

### 1.12.4 — Company switch, invite & bulk ops audit visibility
- Settings exposes `company_switch_audit`, `invite_audit`, `bulk_ops_audit` platform checks
- verify-production gates for company switch, invite accept, and bulk cancel E2E in audit-expanded
- Lint: fix react-hooks exhaustive-deps in notification hub and settings metrics

### 1.12.3 — Company profile & portal audit visibility
- Settings exposes `company_profile_audit` and `portal_audit` platform checks
- verify-production gates for company profile update and portal estimate approve E2E in audit-expanded

### 1.12.2 — Onboarding & vendor PO audit visibility
- Settings exposes `onboarding_audit` and `vendor_po_audit` platform checks
- verify-production gates for onboarding complete and vendor PO to job E2E in audit-expanded

### 1.12.1 — Expense & fuel log audit visibility
- Settings exposes `expense_audit` and `fuel_log_audit` platform checks
- verify-production gates for expense/fuel audit E2E in audit-expanded

### 1.12.0 — Field-ops milestone
- Technician offline sync E2E gated via `tech_offline_sync_audit`
- Settings exposes inventory, fleet, dispatch, and field-ops milestone audit checks
- Platform audit `field_ops_milestone_audit` gate

### 1.11.2 — Hub skip CSV email channel
- Skip log CSV includes email/SMS summary header line
- E2E: email and SMS skip CSV channel column coverage
- Platform audit `notification_hub_email_skip_csv_audit` gate

### 1.11.1 — Hub skip channel filter
- Email/SMS hub tabs filter skip log by channel
- Platform audit `notification_hub_skip_channel_filter_audit` gate

### 1.11.0 — Notification milestone
- Full hub email/SMS skip visibility across dispatch, scheduling, estimate, invoice, and ETA flows
- Portal ↔ CRM notification prefs sync with opt-out badges
- Platform audit `notification_milestone_audit` gate; **228** E2E tests

### 1.10.17 — Hub dispatch & scheduling email skip
- Hub Skipped tab E2E for dispatch scheduled and scheduling email opt-out
- Platform audit `notification_hub_dispatch_email_skip_audit`, `notification_hub_scheduling_email_skip_audit` gates

### 1.10.16 — Hub skip summary breakdown
- Hub summary shows skipped count with email/SMS channel breakdown
- Platform audit `notification_hub_skip_summary_audit` gate

### 1.10.15 — Portal email badge & SMS skip CSV
- Portal email/SMS opt-out badge sync E2E with staff CRM
- Hub skip log CSV export E2E validates SMS channel column
- Platform audit `portal_email_opt_out_badge_audit`, `notification_hub_sms_skip_csv_audit` gates

### 1.10.14 — Portal SMS badge & hub scheduling skip
- Customer portal email/SMS opt-out status badges
- Hub Skipped tab E2E for scheduling SMS opt-out
- Platform audit `portal_sms_opt_out_badge_audit`, `notification_hub_scheduling_sms_skip_audit` gates

### 1.10.13 — SMS badge & hub ETA skip
- Customers table SMS opt-out badge (parity with email badge)
- Hub Skipped tab E2E for dispatch ETA SMS opt-out
- Platform audit `staff_customer_sms_badge_audit`, `notification_hub_eta_sms_skip_audit` gates

### 1.10.12 — Portal SMS sync & hub SMS skip sources
- Bidirectional portal ↔ staff CRM SMS prefs E2E
- Hub Skipped tab E2E for estimate and invoice SMS opt-out
- Platform audit `portal_sms_notify_sync_audit`, `notification_hub_estimate_invoice_sms_skip_audit` gates

### 1.10.11 — Dispatch ETA SMS E2E
- Dispatch in_progress ETA SMS skip/queue E2E
- Invoice SMS queue E2E when CRM prefs allow
- Platform audit `dispatch_eta_sms_audit` gate

### 1.10.10 — Estimate & invoice SMS opt-out
- Estimate/invoice send flows include customer SMS with opt-out gate
- Platform audit `estimate_invoice_sms_audit` gate

### 1.10.9 — Scheduling SMS E2E
- Scheduling page customer SMS skip/queue E2E coverage
- Hub Skipped tab shows SMS channel opt-out reason
- Platform audit `scheduling_customer_sms_audit` gate

### 1.10.8 — Customer SMS opt-out
- Dispatch/scheduling customer SMS with `customerAllowsNotification` SMS gate
- Hub skipped reason labels per channel (email/SMS)
- Platform audit `customer_sms_opt_out_audit` gate

### 1.10.7 — Skip log operator ops
- Hub export/clear skip log CSV for operators
- Platform audit `notification_hub_skip_ops_audit` gate

### 1.10.6 — Notification hub skip log
- Hub Skipped tab shows customer opt-out history
- `notification-skip-log` module; summary includes skipped count
- Platform audit `notification_hub_skip_log_audit` gate

### 1.10.5 — Portal → staff notify sync
- Portal email opt-out E2E syncs to staff CRM customer form and badge
- Platform audit `portal_staff_notify_sync_audit` gate

### 1.10.4 — Skipped toast & CRM ↔ portal sync
- Dispatch/scheduling E2E assert skipped toasts on email opt-out
- Staff CRM prefs sync to customer portal entity field
- Platform audit `notify_skipped_toast_audit` gate

### 1.10.3 — Staff customer notify prefs
- Customer form email/SMS toggles; customers table opt-out badge
- `notifyResultMessage` skipped handling in dispatch/scheduling
- E2E customer form prefs + estimate send opt-out
- Platform audit `staff_customer_notify_audit` gate

### 1.10.2 — Notification opt-out consistency
- Estimate/invoice sends respect customer email preferences
- Notification hub filter E2E; `notification_opt_out_audit` gate

### 1.10.1 — Portal prefs sync & E2E polish
- Portal notification preference RPCs; scheduling locale dates and opt-out
- E2E for dispatch bulk SMS, ETA, portal prefs
- Platform audit `portal_notification_prefs_audit` gate

### 1.10.0 — Recommendations roadmap
- `verify:operator` + edge function smoke in Deploy CI
- Notification hub (filter, status, retry); dispatch bulk SMS + ETA alerts
- Customer portal notification preferences; probe history Supabase sync
- Platform audit `notification_hub_audit` gate

## Test coverage

- Unit: **153** (`npm test`)
- E2E: **201/201** (`npm run test:e2e`)

## Deploy

```bash
# Required in .env.local or GitHub Secrets
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

npm run verify:production
npm run verify:operator
npm run test
npm run test:e2e
npm run smoke:supabase   # optional, live Supabase
```

Push to `main` triggers GitHub Pages deploy. See [POST_RELEASE.md](./POST_RELEASE.md) for the operator checklist.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for secrets, Edge Functions, and schema setup.

## Merge chain

`#63` (1.7.0) → `#64` (1.7.1) → `#65` (1.7.2) → `#66` (1.7.3) → `#67` (1.7.4) → `#68` (docs) — **merged to `main`**
