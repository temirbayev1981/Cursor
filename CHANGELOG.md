# Changelog

All notable changes to HandymanOS AI are documented here.

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
