# Changelog

All notable changes to HandymanOS AI are documented here.

## [1.10.4] — 2026-07-10

Skipped-notification UX E2E and CRM ↔ portal prefs sync.

### Phase 102 — Notify skipped toast & prefs sync
- E2E: dispatch/scheduling show skipped toast when customer email opted out
- E2E: staff CRM email opt-out syncs to customer portal via entity prefs
- Settings audit checklist: `staff_customer_notify_audit`, `notify_skipped_toast_audit`
- Platform audit: `notify_skipped_toast_audit` gate
- **198** E2E tests, **148** unit tests

## [1.10.3] — 2026-07-10

Staff CRM notification preferences and skipped-notification UX.

### Phase 101 — Staff customer notify prefs
- Customer form: email/SMS notification toggles persisted on `customers.notification_preferences`
- Customers table badge when email notifications are disabled
- `notifyResultMessage` handles `skipped`; dispatch/scheduling show opt-out toasts
- E2E: customer form prefs, estimate send opt-out (`est-003` / `cust-004`)
- Platform audit: `staff_customer_notify_audit` gate
- **194** E2E tests, **147** unit tests

## [1.10.2] — 2026-07-10

Consistent customer email opt-out across all notification flows.

### Phase 100 — Notification opt-out consistency
- `notifyEstimateSent` / `notifyInvoiceSent` respect customer email preferences
- `NotificationResult.skipped` flag; invoices/estimates show opt-out toast
- E2E: notification hub filters, invoice send opt-out
- Platform audit: `notification_opt_out_audit` gate
- **192** E2E tests, **144** unit tests

## [1.10.1] — 2026-07-10

Portal notification prefs RPC sync, scheduling opt-out, and v1.10 E2E coverage.

### Phase 99 — Portal prefs & E2E polish
- Portal RPCs: `portal_get_notification_preferences`, `portal_update_notification_preferences`
- Customer portal prefs sync to Supabase + localStorage cache
- Scheduling respects customer email opt-out and uses locale-aware `formatDateTime`
- E2E: dispatch bulk SMS, ETA on `in_progress`, notification opt-out, portal prefs toggle
- Platform audit: `portal_notification_prefs_audit` gate
- **190** E2E tests, **142** unit tests

## [1.10.0] — 2026-07-10

Audit recommendations roadmap — operator tooling, notifications hub, dispatch alerts, portal prefs.

### Phase 98 — Recommendations roadmap
- `verify:operator` script with Supabase + edge function smoke in CI (`SMOKE_EDGE_FUNCTIONS=1`)
- Settings → System: notification hub (filter email/SMS, status badges, retry failed, flush)
- Platform audit alert when score &lt; 8.5; service worker first-visit hint
- Probe history sync to Supabase `integration_probe_runs` with merged local/cloud load
- Dispatch: bulk SMS to scheduled technicians; customer ETA email on `in_progress`
- Customer portal: email/SMS notification preference toggles; `notifyJobScheduled` respects prefs
- Schema: `integration_probe_runs` table, `customers.notification_preferences` JSONB
- Platform audit: `notification_hub_audit` quality gate
- **186** E2E tests, **140** unit tests

## [1.9.5] — 2026-07-10

System audit fixes and operator UX improvements.

### Phase 97 — Audit remediation
- Locale-aware customer notification templates (EN/RU) in `notification-service`
- `observability_probe_audit` gate now respects live probe results
- Platform audit probe history uses reactive `probeHistoryReady` option
- Settings: notification queue flush button; probe history empty-state dedup
- Russian translations for platform audit checklist labels
- Docs: corrected historical **44** audit action count (was 45)
- **185** E2E tests, **133** unit tests

## [1.9.4] — 2026-07-10

Integration probe history for operators.

### Phase 96 — Probe history dashboard
- `integration-probe-history` module persists last 10 probe runs in localStorage
- Settings → System: probe history panel with per-integration Live/Unreachable badges
- Platform audit: `integration_probe_history_audit` quality gate
- `verify:production` checks `INTEGRATION_PROBE_HISTORY_AUDIT` and history module
- **185** E2E tests, **132** unit tests

## [1.9.3] — 2026-07-10

Live integration probe UI in Settings and E2E.

### Phase 95 — Integration probe UI
- `probeIntegrationsForSettings()` — live probes in production, synthetic probes in E2E mock
- Settings → Integrations: probe summary banner, refresh button, Live badges in E2E
- Platform audit: `integration_probe_ui_audit` quality gate
- `verify:production` checks `INTEGRATION_PROBE_UI_AUDIT` and probe UI module
- **185** E2E tests, **128** unit tests

## [1.9.2] — 2026-07-10

Sentry DSN probe and honest service worker offline gate.

### Phase 94 — Sentry probe & PWA offline gate
- Observability probe checks `VITE_SENTRY_DSN` ingest host and `VITE_ERROR_WEBHOOK_URL`
- Async service worker registration (no `window.load` delay); `whenServiceWorkerReady()`
- Honest `offline_sync` gate requires active service worker registration
- Platform audit: `pwa_sw_offline_audit` quality gate
- Settings → System refreshes health score when service worker activates
- **185** E2E tests, **124** unit tests

## [1.9.1] — 2026-07-10

Observability probe and edge function smoke milestone.

### Phase 93 — Observability & edge smoke
- Observability integration probe (`VITE_ERROR_WEBHOOK_URL`) in live integration probes
- Settings → Integrations: observability card with probe-aware unreachable badge
- Platform audit: `observability_probe_audit` quality gate
- `supabase-smoke.mjs`: optional `SMOKE_EDGE_FUNCTIONS=1` OPTIONS/GET probe for 6 edge functions
- `verify:production` checks observability gate and edge smoke support
- **185** E2E tests, **122** unit tests

## [1.9.0] — 2026-07-10

Production readiness visibility milestone.

### Phase 92 — Operator readiness
- Platform audit checklist UI on Settings → System (`platform-audit-checklist`)
- Probe-aware platform health scores (configured-but-unreachable integrations downgrade)
- Maps Static API live probe; `integration_probes` platform audit gate
- Honest PWA/offline sync checks (manifest link + offline queue capability)
- `verify:production` audit invariants (action count, E2E coverage gate, CHANGELOG sync)
- **184** E2E tests, **120** unit tests

## [1.8.9] — 2026-07-10

Full audit E2E coverage for all 44 localized actions.

### Phase 91 — Full audit E2E milestone
- Platform audit: `estimate_create_audit`, `entity_update_audit`, `audit_e2e_full` gates
- Vendor PO workflow now logs `estimate.create`
- Entity edit buttons and form `initial` props for update audit paths
- E2E (+12): bulk delete/schedule, portal decline, property create, entity updates → audit log
- **183** E2E tests, **116** unit tests

## [1.8.8] — 2026-07-10

Invoice, sample import, and portal request audit E2E.

### Phase 90 — Invoice & portal requests audit
- Platform audit: `invoice_audit`, `sample_import_audit`, `portal_requests_audit` gates
- `import-sample-data` test id on Settings → System
- E2E: invoice payment/sent, sample import, portal review/job submit → audit log

## [1.8.7] — 2026-07-10

Bulk ops and billing/team audit E2E.

### Phase 89 — Bulk & billing audit
- Platform audit: `bulk_ops_audit`, `billing_plan_audit`, `team_invite_audit` gates
- E2E: bulk cancel/assign, plan upgrade, team invite → audit log

## [1.8.6] — 2026-07-10

Portal and tenant audit E2E.

### Phase 88 — Portal & tenant audit
- Platform audit: `portal_audit`, `company_switch_audit`, `invite_audit` gates
- E2E: portal estimate approve, portal invoice payment, company switch, invite accept → audit log

## [1.8.5] — 2026-07-10

Vendor PO and company profile audit E2E.

### Phase 87 — Vendor PO & company profile audit
- Platform audit: `vendor_po_audit`, `company_profile_audit` quality gates
- E2E: vendor PO → job, emergency alert, company profile update → audit log
- `company-profile-save` test id on Settings → Company

## [1.8.4] — 2026-07-10

Fuel log audit and dispatch E2E.

### Phase 86 — Fuel log & dispatch audit
- `FuelLogForm` on Vehicles page; `useSaveFuelLog` with `fuel_log.create`/`fuel_log.update`
- Platform audit: `fuel_log_audit`, `dispatch_audit` quality gates
- E2E: fuel log create, dispatch status change → audit log
- **44** localized audit actions

## [1.8.3] — 2026-07-10

Expense audit logging.

### Phase 85 — Expense audit
- `logAudit`: `expense.create`/`expense.update`
- Platform audit: `expense_audit` quality gate (`EXPENSE_AUDIT`)
- E2E: expense create → audit log
- **43** localized audit actions

## [1.8.2] — 2026-07-10

Fleet audit logging and audit coverage summary.

### Phase 84 — Fleet audit & coverage summary
- `logAudit`: `employee.create`/`employee.update`, `vehicle.create`/`vehicle.update`
- Platform audit: `fleet_audit` quality gate (`FLEET_AUDIT`)
- Settings → System: audit coverage summary (`audit-coverage-summary`)
- E2E: employee create, vehicle create, coverage summary
- **41** localized audit actions (`AUDIT_I18N_COVERAGE` ≥ 40)

## [1.8.1] — 2026-07-10

Catalog CRUD and onboarding audit.

### Phase 83 — Catalog & onboarding audit
- `logAudit`: `material.create`/`material.update`, `property.create`/`property.update`, `onboarding.complete`
- Platform audit: `onboarding_audit` quality gate (`ONBOARDING_AUDIT`)
- E2E: material create + onboarding complete → audit log
- **37** localized audit actions

## [1.8.0] — 2026-07-10

**Milestone:** full core-ops audit coverage (inventory + scheduling E2E).

### Phase 82 — Inventory audit & v1.8.0
- `logAudit`: `inventory.receive`, `inventory.apply`
- Platform audit: `inventory_audit` quality gate (`INVENTORY_AUDIT`)
- E2E: schedule create, stock receive, materials apply → audit log
- 32 localized audit actions (`AUDIT_I18N_COVERAGE` ≥ 30)

## [1.7.10] — 2026-07-10

Field-ops audit coverage and platform audit gate.

### Phase 81 — Field ops audit
- `logAudit`: `job.create`/`job.update`, `schedule.create`, `estimate.sent`
- Platform audit: `audit_i18n` quality gate (`AUDIT_I18N_COVERAGE`, 28+ actions)
- E2E: job create and estimate send audit entries
- POST_RELEASE: stale PR status (#63–#71 merged)

## [1.7.9] — 2026-07-10

E2E coverage for expanded audit actions.

### Phase 80 — Audit E2E
- E2E: `customer.create`, `invoice.create`, `job.status_change` audit log entries
- `data-audit-action` + `audit-log-list` test ids for stable selectors
- Integration probes skipped in E2E mock backend (no false unreachable badges)
- `openSettingsAuditTab` Playwright helper

## [1.7.8] — 2026-07-10

Async integration probes and expanded audit logging.

### Phase 79 — Integration probes & audit
- `probeLiveIntegrations()`: async reachability checks for Stripe, Supabase, OpenAI, email, SMS endpoints
- Settings → Integrations: live probe badges (Live / Unreachable / Checking)
- Expanded `logAudit`: `customer.create`/`customer.update`, `invoice.create`, `job.status_change`
- Localized audit labels (EN/RU) for new actions

## [1.7.7] — 2026-07-10

Stripe subscription audit, CI smoke fix, rate-limit RPC check.

### Phase 78 — Stripe & CI smoke
- Stripe webhook: `billing.plan_upgrade` audit log on SaaS subscription checkout
- Platform audit: `stripe_webhook_audit` quality gate (`STRIPE_WEBHOOK_AUDIT`)
- `smoke:supabase`: `check_rate_limit` RPC; `SMOKE_OPTIONAL=1` skips gracefully without creds
- CI workflows: smoke runs without invalid `secrets` in `if` conditions

## [1.7.6] — 2026-07-10

Supabase smoke expansion, Stripe webhook audit, release workflow.

### Phase 77 — Production hardening
- `smoke:supabase`: validates 8 tables + 5 portal/team RPCs
- `supabase/UPGRADE.md`: schema upgrade paths (1.6→1.7, 1.7.x)
- Stripe webhook: `invoice.payment` audit log on checkout complete
- GitHub Actions: `release.yml` runs verify on version tags

## [1.7.5] — 2026-07-10

Post-release ops and CI improvements.

### Phase 76 — Post-release
- POST_RELEASE.md: operator checklist (secrets, Supabase, smoke, audit)
- deploy.yml: VITE_APP_VERSION from package.json (no manual sync)
- MERGE.md / RELEASE.md: mark 1.7.4 stack as merged
- verify:production: dynamic version check, POST_RELEASE required

## [1.7.4] — 2026-07-10

Audit P4: localized audit log, release sync.

### Phase 73 — Audit P4 & release consolidation
- Settings audit log: localized action labels (EN/RU)
- Audit log: bulk assign/schedule, sample import, plan upgrade, portal invoice payment
- Platform audit: `MULTI_TENANT_MEMBERSHIP_RPC` quality gate constant
- `deploy.yml` VITE_APP_VERSION synced to 1.7.4
- RELEASE.md consolidated for 1.7.x stack
- E2E: localized audit log entry after team invite

### Phase 74 — Release docs consolidation
- README/DEPLOYMENT updated for 1.7.4 (138 E2E, production-only)
- MERGE.md: step-by-step guide for stacked PRs #63–#68
- `smoke:supabase`: validates portal and multi-tenant RPCs
- `verify:production`: README version sync + MERGE.md required

## [1.7.3] — 2026-07-10

E2E stabilization: mock backend fixes, locale switching, portal pay.

### Phase 72 — E2E fixes & production pay fallback
- E2E mock: composite upsert conflict keys (`company_id,vendor_po_number`) — fixes vendor PO batch seed/upload
- E2E mock: pre-seed `vendor_po_records`; respect onboarding-fresh flag in sync
- E2E auth helper: locale updates on re-login within same session
- Stripe pay button: manual cash payment when Stripe is not fully configured (not only when endpoint is missing)
- Portal magic link E2E uses seeded RPC token

## [1.7.2] — 2026-07-10

Audit P3: expanded audit logging, portal RPC-only hooks, quality gates.

### Phase 71 — Audit P3 continuation
- Audit log: bulk job cancel, invoice payment/send, company profile update
- Portal audit: estimate approve/decline, job submit, review submit
- Portal hooks: RPC-only (removed `saveEntity` fallbacks on RPC failure)
- Platform audit: compile-time quality gates (`PORTAL_RPC_ENFORCED`, `TYPED_SUPABASE_QUERIES`, `MULTI_TENANT_SUPPORTED`)
- E2E: bulk delete confirm label assertion; Russian audit recommendations on System tab

## [1.7.1] — 2026-07-10

Audit P2 fixes: portal security, audit i18n, metrics.

### Phase 70 — Audit P2 fixes
- Portal data: RPC-only fetch (no localStorage bypass on RPC failure)
- Portal tokens: RPC-only validation (reject local-only tokens)
- Platform audit: localized recommendations and summary keys
- Platform health: offline_sync uses PWA support (not SW controller)
- System metrics: notification queue affects health status
- Settings System tab i18n (Supabase, notifications, error reports)
- Audit log: team invites, invite accept, bulk job delete
- Tests: portal bypass rejection, notification queue degraded, audit branches

## [1.7.0] — 2026-07-10

Production-only release: demo mode removed, Supabase required.

### Phase 69 — Remove demo mode (production-only)
- **Breaking:** `DEMO_MODE` removed — app requires Supabase (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`)
- `SupabaseRequiredScreen` when backend is not configured
- Auth, entity, company, portal, invite, billing, and Stripe services use Supabase only
- E2E/CI: in-memory Supabase mock (`VITE_E2E_MOCK_BACKEND`) for Playwright and Vitest
- Removed demo UI: login hints, sidebar banner, portal demo bypass
- Notifications: `queued` flag instead of `demo`; local queue when webhooks are unset
- Settings: **Import sample data** (renamed from demo import)
- i18n cleanup: removed demo-mode strings
- Updated `.env.example`, README, DEPLOYMENT

## [1.6.4] — 2026-07-10

Audit P1 fixes: i18n toasts, expense categories, bulk delete confirm.

### Phase 68 — Audit P1 fixes
- i18n toasts for estimates, invoices, Stripe pay button
- Localized expense categories in forms, dashboard, and reports charts
- `localizeExpenseChart()` shared in analytics; removed deprecated `exportReportPdfPlaceholder`
- Jobs bulk delete requires two-click confirmation
- Unit tests for `export` and `localizeExpenseChart`
- E2E: bulk delete confirm, portal access EN, scheduling EN

## [1.6.3] — 2026-07-10

Portal review EN and route optimizer i18n E2E.

### Phase 67 — Portal review & route optimizer EN
- Customer portal review form testids
- Route optimizer open maps link testid
- `clearPortalReview()` E2E helper
- E2E: portal review EN, dispatch route optimizer EN

## [1.6.2] — 2026-07-10

Portal invoices EN, dispatch map i18n, jobs bulk on-hold.

### Phase 66 — Portal invoices EN & map i18n
- Customer portal invoices heading `customer-portal-invoices-heading`
- Dispatch map fallback `mapsApiKeyHint` i18n in `JobMap`
- E2E: portal EN invoices/pay, dispatch map EN fallback, bulk on-hold apply

## [1.6.1] — 2026-07-10

Report expenses PDF i18n and jobs bulk delete.

### Phase 65 — Expenses PDF & bulk delete
- Report PDF expenses tab export with localized Labor/Materials/Fuel labels
- `reports-tab-expenses` testid
- Jobs bulk delete with `jobs-bulk-delete` and `useBulkDeleteJobs()`
- E2E: expenses PDF i18n, bulk delete draft jobs

## [1.6.0] — 2026-07-10

Report profit/financial PDF i18n, jobs on-hold tab, portal EN approve/decline.

### Phase 64 — Profit PDF, on-hold tab & portal EN actions
- Jobs page «Приостановленные» / «On Hold» filter tab with `jobs-tab-on-hold`
- Reports profit/financial tab testids for PDF export E2E
- E2E helpers `seedOnHoldJob()` and `resetEstimateStatus()`
- E2E: profit/financial PDF i18n, customer portal EN approve/decline, on-hold tab filter

## [1.5.7] — 2026-07-10

Cancelled jobs tab, report services/customers PDF i18n, customer portal EN.

### Phase 63 — Cancelled tab, report PDF tabs & portal EN
- Jobs page «Отменённые» / «Cancelled» filter tab with `jobs-tab-cancelled`
- Reports services/customers tab testids for PDF export E2E
- Customer portal title/estimates heading testids
- E2E: customer portal EN, services/customers PDF i18n, cancelled tab filter

## [1.5.6] — 2026-07-10

Property portal EN, report technicians PDF tab, jobs bulk cancel.

### Phase 62 — Portal EN, report tech PDF & bulk cancel
- Jobs bulk cancel action with `jobs-bulk-cancel` button
- Property portal request form testids for E2E
- Reports technicians tab `data-testid="reports-tab-technicians"`
- E2E: property portal English, report PDF technicians tab i18n, bulk cancel (`portal-reports-bulk-cancel.spec.ts`)

## [1.5.5] — 2026-07-10

Portal estimate decline, jobs bulk schedule & assign, shared PDF table labels.

### Phase 61 — Portal decline, bulk schedule & CI smoke
- Shared `PdfTableLabels` for estimate/invoice PDF exports
- `useBulkScheduleJobs()` — schedule + assign technician in one action
- Portal estimate approve/decline `data-testid` anchors
- E2E: portal decline estimate, jobs bulk schedule (`portals.spec.ts`, `jobs-bulk-estimate-i18n.spec.ts`)
- Optional Supabase smoke step in deploy workflow when secrets are configured

## [1.5.4] — 2026-07-10

Localized report PDF, jobs bulk technician assign, portal invoice pay E2E.

### Phase 60 — Report i18n PDF, bulk assign & portal pay
- Localized `exportReportPdf()` labels (RU/EN) via `t.reports.pdf`
- Jobs bulk technician assignment with `useBulkAssignTechnician()`
- E2E: report PDF i18n, bulk assign, portal demo pay (`reports-portal-bulk.spec.ts`)

## [1.5.3] — 2026-07-10

Localized estimate PDF export and jobs bulk status actions.

### Phase 59 — Estimate i18n PDF & jobs bulk actions
- Localized `exportEstimatePdf()` labels (RU/EN) via `t.estimates.pdf`
- Jobs page bulk selection with select-all, status dropdown, and apply bar
- `useBulkUpdateJobStatus()` hook for batch status updates
- E2E: estimate PDF i18n, jobs bulk schedule + select-all (`jobs-bulk-estimate-i18n.spec.ts`)
- Fixed hardcoded draft tab label on jobs page

## [1.5.2] — 2026-07-10

Dispatch map E2E, localized invoice PDF export, multi-PDF vendor PO batch.

### Phase 58 — Dispatch map, i18n invoice PDF & vendor PO batch
- Localized `exportInvoicePdf()` labels (RU/EN) via `t.invoices.pdf`
- `data-testid` on dispatch job map card and map fallback/canvas
- E2E: dispatch job map addresses, invoice PDF i18n (`dispatch-map-i18n-pdf.spec.ts`)
- E2E: multi-PDF vendor PO batch upload (2 records)
- Fixture: `e2e/fixtures/vendor-po-emergency.pdf`

## [1.5.1] — 2026-07-10

Invoice PDF export and billing/work orders E2E.

### Phase 57 — Invoice PDF & work orders E2E
- `exportInvoicePdf()` with print-ready HTML preview
- PDF export button on each invoice row
- E2E: invoice PDF preview, summary stats, vendor PO batch UI (`invoice-pdf-workorders.spec.ts`)
- `data-testid` on invoice export, outstanding total, vendor PO record count

## [1.5.0] — 2026-07-10

Release consolidating Phases 50–55 (properties, technicians, dispatch, settings, onboarding, vendor PO).

### Phase 56 — Estimate PDF export & release consolidation
- `exportEstimatePdf()` with print-ready HTML preview
- PDF export button on each estimate row
- E2E: estimate PDF preview title, total, line items (`estimate-pdf-release.spec.ts`)
- Version bump to **1.5.0**, 92 E2E tests total

### Phases 50–55 (included in 1.5.0)
- **50:** Properties & job inventory E2E
- **51:** Technicians, theme toggle, reports export E2E
- **52:** Dispatch DnD, AI chat input, reports PDF E2E
- **53:** Settings billing/team, dashboard analytics E2E
- **54:** Onboarding wizard, invite errors, vendor Excel export E2E
- **55:** Vendor PO multi-site, global search, AI follow-up, invoice send E2E

## [1.4.7] — 2026-07-10

Vendor PO multi-site, AI follow-up, search & invoice send E2E.

### Phase 55 — Vendor PO, search, AI & invoice E2E
- E2E: vendor PO multi-site badge and emergency priority rows
- E2E: AI assistant multi-turn chat (`vendor-search-ai-invoice.spec.ts`)
- E2E: global header search navigation
- E2E: draft invoice send demo notification
- `seedDraftInvoice` helper; testids on multi-site badge, search, invoice send

## [1.4.6] — 2026-07-10

Onboarding wizard, invite errors, and vendor PO export E2E.

### Phase 54 — Onboarding, invite & vendor export E2E
- E2E: owner onboarding wizard through dashboard (`onboarding-invite-vendor.spec.ts`)
- E2E: onboarding validation (company name + services required)
- E2E: expired/unknown invite link error alerts on login
- E2E: vendor PO Excel export download
- Login invite error UI; `data-testid` on onboarding and vendor export

## [1.4.5] — 2026-07-10

Settings billing/team and dashboard analytics E2E.

### Phase 53 — Settings & dashboard E2E
- E2E: billing plan upgrade in demo mode (`settings-dashboard.spec.ts`)
- E2E: team invite creates pending invite row
- E2E: dashboard stat cards, charts, recent jobs
- `data-testid` on billing plans, team invite form, dashboard sections

## [1.4.4] — 2026-07-10

Dispatch drag-and-drop, AI chat input, and reports PDF E2E.

### Phase 52 — Dispatch, AI chat & PDF export E2E
- E2E: dispatch kanban drag-and-drop status change (`dispatch-ai-pdf.spec.ts`)
- E2E: route optimizer panel + Google Maps link
- E2E: AI assistant custom input and suggested questions
- E2E: reports PDF export preview popup
- `data-testid` on dispatch columns, route panel, AI chat controls
- Dispatch kanban columns use `useDroppable` for cross-column drag-and-drop

## [1.4.3] — 2026-07-10

Technicians, theme toggle, and reports export E2E.

### Phase 51 — Technicians, theme & reports E2E
- E2E: technicians demo cards, create technician (`technicians-theme-reports.spec.ts`)
- E2E: settings + command palette theme toggle
- E2E: reports technicians tab, CSV export download
- `data-testid` on employee form, theme toggle, report export buttons

## [1.4.2] — 2026-07-10

Properties and job inventory E2E.

### Phase 50 — Properties & inventory E2E
- E2E: properties demo cards, create property (`properties-inventory.spec.ts`)
- E2E: job material deduction updates inventory quantity
- `data-testid` on property form, job material usage dialog
- `verify:production` checks `supabase-smoke.yml` workflow

## [1.4.1] — 2026-07-10

Fleet, expenses, and command palette E2E.

### Phase 49 — Fleet, expenses & command palette E2E
- E2E: vehicles fleet/fuel logs, create vehicle (`fleet-expenses.spec.ts`)
- E2E: create expense + monthly total update
- E2E: command palette Ctrl+K navigation and customer search
- `openCommandPalette` helper; `data-testid` on forms and palette

## [1.4.0] — 2026-07-10

Release consolidating Phases 43–48 (work orders AI, vendor PO, workflows, billing, CRM, inventory).

### Phase 48 — Release consolidation & materials E2E
- Version bump to **1.4.0**
- E2E: materials low-stock alert, receive stock, create material (`materials.spec.ts`)
- `data-testid` on material form, receive dialog, stock actions

### Phase 47 — Jobs & customers E2E (1.3.6)
- E2E: create customer/job, search filters, portal link, draft tab

### Phase 46 — Estimates & invoices E2E (1.3.5)
- E2E: smart engine, create/send/convert estimate, demo invoice payment

### Phase 45 — Workflow E2E (1.3.4)
- E2E: vendor PO → job, PDF tab analyze, scheduling calendar

### Phase 44 — Vendor PO PDF E2E (1.3.3)
- PDF upload parse; `normalizeVendorPOText()` for PDF.js flat text

### Phase 43 — Work orders upload E2E (1.3.2)
- Photo + email AI import E2E; docs parity

## [1.3.6] — 2026-07-10

Jobs and customers CRUD E2E.

### Phase 47 — Jobs & customers E2E
- E2E: create customer, search filter, portal link copy (`jobs-customers.spec.ts`)
- E2E: create job, search filter, draft status tab
- `data-testid` on job/customer forms, search inputs, portal link button

## [1.3.5] — 2026-07-10

Estimates and invoices workflow E2E.

### Phase 46 — Estimates & invoices E2E
- E2E: smart engine panel, create estimate, send draft, convert to invoice
- E2E: invoices demo payment flow (`estimates-invoices.spec.ts`)
- `data-testid` on estimate form, send/convert actions, invoice pay button

## [1.3.4] — 2026-07-10

Workflow E2E for vendor PO, PDF import, and scheduling.

### Phase 45 — Workflow E2E
- E2E: vendor PO PDF → create job + estimate → jobs page (`work-orders-vendor-po.spec.ts`)
- E2E: work orders PDF tab text analyze (`work-orders-upload.spec.ts`)
- E2E: scheduling week view + schedule draft job (`scheduling.spec.ts`)
- `data-testid` on vendor PO create-job, PDF analyze, schedule form submit

## [1.3.3] — 2026-07-10

Vendor PO PDF upload E2E.

### Phase 44 — Vendor PO PDF E2E
- E2E: vendor PO tab PDF upload → parse success → table row (`e2e/work-orders-vendor-po.spec.ts`)
- Fixture: `e2e/fixtures/vendor-po-sample.pdf` (CD Maintenance sample PO)
- `data-testid="work-orders-vendor-po-dropzone"` for stable file upload

## [1.3.2] — 2026-07-10

Work orders AI import E2E and documentation parity.

### Phase 43 — Work orders upload E2E
- E2E: photo tab image upload → AI analysis results (`e2e/work-orders-upload.spec.ts`)
- E2E: email tab sample work order processing
- `data-testid="work-orders-photo-dropzone"` for stable file upload
- README: `/dispatch` route; `.env.example`: `VITE_APP_VERSION`, `VITE_ENABLE_E2E_ROUTES`

## [1.3.1] — 2026-07-10

Field ops completion and production audit parity.

### Phase 42 — Offline photo & platform audit
- E2E: offline photo upload → `photo_upload` queue → sync (5/5 offline actions covered)
- Unit tests: `storage-service` demo upload + `listJobPhotos`
- Platform health: observability check (`VITE_SENTRY_DSN` / `VITE_ERROR_WEBHOOK_URL`)
- Platform audit recommends observability when unset
- Settings integrations: i18n labels, separate Email/SMS cards
- E2E: Settings → Integrations tab configure badges in demo

## [1.3.0] — 2026-07-10

Release consolidating Phases 36–41 (field ops hardening, offline sync, dispatch, error paths).

### Phase 41 — Release consolidation & notification bell
- Version bump to **1.3.0**
- E2E: notification bell panel shows queued demo email after scheduling
- Optional `workflow_dispatch` Supabase smoke (`scripts/supabase-smoke.mjs`)
- `verify:production` checks `deploy.yml` version matches `package.json`

### Phase 40 — Error boundary & portal errors (1.2.8)
- E2E crash route + error boundary RU/EN; portal access invalid/expired token
- `observability` unit tests; deploy workflow runs `verify:production`
- Auto-discover all `e2e/*.spec.ts` in production gate

### Phase 39 — Tech offline completion (1.2.7)
- E2E: clock-out and complete-job offline sync
- All five offline action types unit-tested; mobile a11y polish

### Phase 38 — Dispatch notifications (1.2.6)
- Dispatch status select + E2E SMS/email on scheduled
- `notification-service` unit tests (8 tests)

### Phase 37 — Tech mobile offline E2E (1.2.5)
- Offline notes + clock-in E2E; `saveTimeEntry` demo store fix

### Phase 36 — PWA & bundle splitting (1.2.4)
- Main chunk ~176 KB; service worker `handymanos-v2`; PWA E2E

## [1.2.8] — 2026-07-10

Error boundary, portal errors, and CI/docs parity.

### Phase 40 — Error boundary & portal errors
- E2E crash route (`/e2e/crash`) gated by `VITE_ENABLE_E2E_ROUTES` at build time
- E2E: error boundary RU/EN copy + `handymanos_error_reports` capture
- E2E: portal access invalid/missing token error states
- Unit tests: `observability.ts` (`captureError`, report cap)
- `role="alert"` on error boundary and portal access errors
- `verify:production` auto-discovers all `e2e/*.spec.ts` files
- Deploy workflow runs `verify:production` before build
- DEPLOYMENT.md / README version and test-count fixes
- `reports-tech` E2E: explicit assertions instead of silent skips

## [1.2.7] — 2026-07-10

Complete technician offline sync coverage and mobile a11y.

### Phase 39 — Tech offline completion
- E2E: clock-out offline → queue → sync when online
- E2E: complete job offline (`update_job_status`) → sync
- Unit tests: `clock_out`, `update_job_status`, `photo_upload` in offline-sync-service
- Unit test: `syncOfflineQueue` partial failure keeps failed items
- Job notes dialog: `role="dialog"`, `aria-modal`, labelled close
- Technician mobile: `aria-live` on connection status; safe `start_time` fallback for GPS

## [1.2.6] — 2026-07-10

Dispatch notification coverage without fragile drag-and-drop E2E.

### Phase 38 — Dispatch notifications
- Dispatch board: per-card status select (drag-and-drop unchanged)
- Shared `handleJobStatusChange` for select and DnD paths
- E2E: move draft job to scheduled via select → demo SMS + email (`e2e/dispatch-notifications.spec.ts`)
- Unit tests for `notification-service` (8 tests)
- `verify:production` checks dispatch E2E spec

## [1.2.5] — 2026-07-10

Technician offline sync E2E coverage.

### Phase 37 — Tech mobile offline E2E
- E2E: save job notes offline → queue → sync when online (`e2e/tech-offline.spec.ts`)
- E2E: clock-in offline → queue → sync when online
- Shared E2E helpers: `seedInProgressTechJob`, `setPageOffline`, `setPageOnline`
- Unit tests: `clock_in` and `update_job` in `offline-sync-service.test.ts`
- `verify:production` checks `e2e/tech-offline.spec.ts`

## [1.2.4] — 2026-07-10

Performance and PWA polish.

### Phase 36 — PWA & bundle splitting
- Vite manual chunks: motion, router, query, radix, icons, react-vendor, dnd-kit, date-fns
- Service worker cache bump (`handymanos-v2`)
- E2E: manifest.json + service worker registration (`e2e/pwa.spec.ts`)
- Unit tests for offline queue (`src/lib/pwa.test.ts`)
- `verify:production` checks PWA assets

## [1.2.3] — 2026-07-10

Patch release — production docs and notification E2E.

### Phase 34 — i18n E2E coverage
- E2E: AI assistant fallback answers in RU and EN locales
- E2E: Vendor PO compliance checklist localized (RU/EN)
- E2E: language switcher toggles dashboard heading

## [1.2.2] — 2026-07-10

Release consolidating Phases 31–33.

### Phase 33 — AI fallbacks & vendor PO i18n
- `src/i18n/ai-fallbacks.ts` — localized AI system prompts and demo responses
- `buildBusinessContext` respects active locale
- Vendor PO: compliance checklist, multi-site badge, job creation toasts (EN/RU)

### Phase 32 — i18n cleanup
- `useDateLocale` hook centralizes `ru-RU` / `en-US` formatting
- Settings: theme labels, billing/invite/company toasts moved to i18n
- Route optimizer panel, technician onboarding, customers, invoices, materials toasts
- Language switcher labels in i18n
- `notifyResultMessage` accepts translated error string from callers

### Phase 31 — Login i18n, audit gate, invite E2E
- Login page auth strings moved to i18n (EN/RU)
- Platform audit quality gate: multi-company membership
- Fix: accept invite after sign-in uses session profile (React state race)
- E2E: existing user signs in with invite to join another company
- README and RELEASE.md updated for v1.2.1

## [1.2.1] — 2026-07-10

### Phase 30 — Multi-company invites & production verification
- Existing users can sign in with invite link to join additional companies
- `acceptInviteForCurrentUser` + demo `company_memberships` localStorage
- `addCompanyMembership` tracked in company switcher
- `npm run verify:production` readiness script (schema + release gate)
- E2E: company switcher changes active tenant

## [1.2.0] — 2026-07-10

Release consolidating Phases 25–29.

### Phase 29 — Release consolidation
- Version bump to 1.2.0
- E2E test: customer portal review submission
- `VITE_APP_VERSION` injected at build time for Sentry releases
- Deploy workflow: `VITE_ERROR_WEBHOOK_URL` secret support
- `RELEASE.md` updated with full deploy checklist

### Phase 28 — Portal reviews & i18n polish
- Customer portal: star rating review form with `portal_submit_review` RPC
- Payment success toast on `?paid=` return from Stripe
- Dispatch & scheduling: full i18n for page headers and notification toasts
- Vite manual chunk for `@sentry/react`

### Phase 27 — Observability & multi-tenant membership
- Notification bell panel in header (queue preview, clear, badge count)
- `@sentry/react` SDK when `VITE_SENTRY_DSN` is set (with store API fallback)
- `company_members` junction table + `get_accessible_companies` RPC
- Production company switcher validates membership via RPC
- Owner signup creates membership row; invite accept upserts membership
- Fixed `react-hooks/exhaustive-deps` in work-orders and technician-mobile

### Phase 26 — Production polish
- Company settings persist to Supabase via `updateCompanyProfile` + auth context refresh
- Portal i18n: `portalAccess` strings, empty invoice state, sign-out labels
- Scheduling: day view on mobile, horizontal week scroll, hook dependency fixes
- Distributed rate limiting: `rate_limit_buckets` table + `check_rate_limit` RPC
- Stripe checkout edge function rate limited (auth + portal paths)

### Phase 25 — P2 polish (audit follow-up)
- `switchCompany` syncs `profiles.company_id` to Supabase in production
- Offline sync returns `false` for unknown queue actions
- Error boundary i18n (EN/RU via locale storage)
- Vite manual chunks: recharts, pdfjs, xlsx, supabase
- Sentry DSN proper store API; optional `VITE_ERROR_WEBHOOK_URL`
- Edge rate limits keyed by user + client IP; bucket cleanup

### Security & portal hardening (audit fixes)
- Portal RPCs: `get_portal_estimates/invoices/jobs`, `portal_update_estimate_status`, `portal_submit_job_request`
- Portal validation RPC-first in production (no localStorage bypass)
- Portal pages use scoped data hooks + server mutations
- Invite accept: RPC-first, email must match invite
- Stripe checkout: requires auth or portal token + amount validation
- Storage bucket private with signed URLs
- Auth listener leak fixed; platform audit quality gates updated

### Mobile layout
- Responsive drawer navigation on phones (hamburger menu, full-width content)
- Safe-area insets for iOS notch/home indicator
- Compact header, padding, charts, and dashboard job cards on small screens

## [1.1.0] — 2026-07-10

Platform consolidation release (Phases 8–24).

### Phase 24 — Release consolidation
- Version bump to 1.1.0
- `npm run verify:release` — lint + unit tests + build gate
- GitHub Pages deploy injects `VITE_*` secrets from repository settings
- `RELEASE.md` with production checklist and secrets table
- Auto GitHub Release tag on push to `main`
- Lint fixes: service worker JS types, rename `applyMaterialsOnJob`

### Phase 23 — Type safety & release prep
- Typed `supabase-queries` helper (`insertRows`, `upsertRows`, `updateRows`)
- Centralized Supabase type casts in lib layer (services no longer use `as never`)
- Platform audit quality gate: type-safe Supabase queries
- Unit tests for query helper types

### Phase 22 — Final audit & consolidation
- Platform audit score (integration + quality) in Settings → System
- Dashboard profit margin includes monthly overhead expenses
- Settings System tab fully i18n (EN/RU)
- `.env.example`, `CHANGELOG.md`, `DEPLOYMENT.md` section fixes
- README route table updates

### Phase 21 — Database types & tenant scoping
- Complete `database.ts` for all Supabase tables
- Removed `SupabaseOps` shim; typed `EntityTable` helpers
- Explicit tenant filters for payments, fuel logs, inventory
- `entity-service` unit tests

### Phase 20 — Technician lite onboarding
- `/tech-onboarding` 2-step wizard for invited technicians
- Auto-link `employees.profile_id` on invite acceptance
- Supabase company fetch for production switcher
- Realtime job assignments on technician mobile

### Phase 19 — Supabase auth hardening
- `accept_team_invite` SECURITY DEFINER RPC
- Typed `supabase-rpc` helper
- Service unit tests (invite, auth, portal, onboarding)
- E2E invite flow + portal magic link
- Playwright gate in deploy workflow

### Phase 18 — Role routing & observability
- Post-login routing by role (`/tech` for technicians)
- Invited members skip owner onboarding
- System metrics panel (errors, offline/notification queues)
- Edge function rate limiting
- Audit log for dispatch and estimates

### Phase 17 — Multi-tenant demo
- Company switcher with per-company seeding
- Second demo tenant (Sunrise Property Services)
- Audit log UI in Settings

### Phase 16 — Deploy & onboarding
- GitHub Pages deploy workflow
- Onboarding draft save + validation
- Platform health score in Settings

### Phases 8–15 — Core platform
- Inventory, materials, dispatch, scheduling
- Technician mobile (GPS, offline sync, notes)
- Reports with date filters, Excel/PDF export
- Analytics trends and expense breakdown
- Customer/property portals with magic links
- Team invites, billing (Stripe-ready), CI/E2E tests

## [1.0.0] — Demo-ready SaaS foundation

- React 19 + Vite 8 + TypeScript + Tailwind 4
- Supabase schema with RLS, Edge Functions
- 20+ feature modules, role-based access, demo mode
