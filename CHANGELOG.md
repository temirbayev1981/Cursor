# Changelog

All notable changes to HandymanOS AI are documented here.

## [1.14.45] — 2026-07-12

Audit P11: customer contact lookups on ops pages.

### Performance
- `listCustomerContacts` extended with `address` for scheduling locations
- Invoices, jobs, dispatch, scheduling use `useCustomerContacts` instead of `useCustomers()`
- Invoice and job forms accept lightweight `CustomerContact[]`

### Operator UX
- `CUSTOMER_CONTACTS_AUDIT` quality gate in platform audit checklist

## [1.14.44] — 2026-07-12

Audit P10: estimates page lightweight context queries.

### Performance
- `listCustomerContacts` — customer picker + notify fields without full CRM rows
- `getSmartEngineJobContext` — smart engine stats without full job list
- Estimates convert uses `listInvoiceNumbers` on demand

### Operator UX
- `ESTIMATES_LIGHTWEIGHT_AUDIT` quality gate in platform audit checklist

## [1.14.43] — 2026-07-12

Audit P9: invoice and materials KPI summaries, Stripe return fetch by id.

### Performance
- `getInvoicesSummary` / `getMaterialsSummary` — lightweight KPI queries on paginated pages
- `fetchInvoiceById` — Stripe `?paid=` return without full invoice list
- `useInvoicesSummary` / `useMaterialsSummary` on invoices and materials pages

### Operator UX
- `KPI_SUMMARY_AUDIT` quality gate in platform audit checklist
- E2E: audit recommendation links open Settings → Integrations

## [1.14.42] — 2026-07-12

Audit P8: KPI summary queries, platform audit links, server pagination gate.

### Performance
- `getFuelLogsSummary` / `getExpensesSummary` — lightweight KPI queries (tables stay paginated)
- `useFuelLogsSummary` / `useExpensesSummary` on vehicles and expenses pages

### Operator UX
- Platform audit recommendations link to Settings → Integrations cards
- `SERVER_PAGINATION_AUDIT` quality gate in platform audit checklist

## [1.14.41] — 2026-07-12

Audit P7: server-side fuel log pagination — completes Phase 135 table pagination.

### Performance
- `listFuelLogsPage` — paginated fuel logs scoped to company vehicles
- `useServerFuelLogsTable` — vehicles page fuel log table
- No entity pages use client-side `useTablePagination`

### Tests
- `entity-service.test.ts` — fuel log pagination + scoped cache tests
- `a11y-axe.spec.ts` — fuel logs server pagination gate

## [1.14.40] — 2026-07-12

Audit P6: server-side pagination for estimates, expenses, materials (Phase 135 completion).

### Performance
- `listEntitiesPage` — extends to estimates, expenses, materials
- `useServerEntityTable` — estimates, expenses, materials pages
- Empty unfiltered first page clears company-scoped cache (no ghost rows)

### Tests
- `entity-service.test.ts` — pagination + empty-page cache tests
- `a11y-axe.spec.ts` — server pagination on estimates/expenses/materials

## [1.14.39] — 2026-07-12

Audit P5+: full E2E visibleText migration, portal token cache fix.

### E2E
- All remaining specs — `page.getByText` → `visibleText` (dual-layout safe)
- `verify-production` gates for key visibleText specs

### Data integrity
- `portal-service.listPortalTokens` — empty remote list clears company-scoped token cache

## [1.14.38] — 2026-07-12

Audit P5: entity cache fix, E2E visibility, scoped chart prefetch, pdfjs lazy, tests, docs.

### Data integrity
- `entity-service` — empty Supabase list responses clear company-scoped cache (no stale ghost rows)
- `data-store` — `replaceCompanyInStore`, `replaceScopedInStore` helpers

### Bundle
- `chart-prefetch` — recharts only on `/dashboard` and `/reports`
- `pdf-extract` — dynamic import of `pdfjs-dist`

### E2E
- `audit-expanded.spec.ts`, `settings-dashboard.spec.ts` — `visibleText` throughout

### Tests
- `ai.test.ts` — fallback analyzers and smart estimate
- `export.test.ts` — estimate/invoice PDF HTML
- `entity-service.test.ts` — empty server list clears cache

### Docs
- `DEPLOYMENT.md` — 259 unit / 275 E2E / 56 specs
- `RELEASE.md` — reports cards-only correction

## [1.14.37] — 2026-07-12

Pre-merge E2E fixes for dual mobile/desktop layouts and portal invoice seeding.

### E2E
- `expectCustomerNameVisible` helper restored in `visibility.ts`
- Vendor PO specs use visible locators (`vendor-po-210071`, `vendor-po-null-render`, `vendor-search-ai-invoice`)
- Portal invoice pay tests: seed after portal mount, wait for pay button
- `playwright.config.ts` ignores live-only specs (`stripe-live`, `live-backend-smoke`)

## [1.14.36] — 2026-07-12

Audit P4: lazy export in vendor PO, lazy AI in assistant, RELEASE sync.

### Bundle
- `vendor-po-table.tsx` — dynamic import of `@/lib/export` on Excel export; `vendor-po-groups.ts` for address grouping
- `ai-assistant.tsx` — dynamic import of `@/lib/ai` on send; `ai-context.ts` for lightweight business context
- `verify-production-readiness` gates for vendor-po export + ai-assistant lazy imports

### Docs
- `RELEASE.md` — Audit P4 summary (1.14.25–1.14.36)

## [1.14.35] — 2026-07-12

Audit P4: lazy export in billing/reports, mobile-smoke refresh.

### Bundle
- `invoices.tsx`, `estimates.tsx`, `reports.tsx` — dynamic import of `@/lib/export` on PDF/CSV export
- `verify-production-readiness` gates for billing/reports export imports

### E2E
- `visibleCommandPalette` helper; fleet-expenses + technicians-theme-reports use it
- `mobile-smoke.spec.ts` — customer/job card layouts on iPhone 13 viewport

## [1.14.34] — 2026-07-12

Audit P4: lazy AI in estimates, dispatch/dashboard mobile E2E.

### Bundle
- `estimates.tsx` — dynamic import of `generateSmartEstimate` when smart engine opens
- `verify-production-readiness` gate for estimates dynamic ai import

### E2E
- `dispatch-mobile-layout.spec.ts`, `dashboard-mobile-layout.spec.ts`
- Visible locators in dispatch-map-i18n-pdf, dispatch-ai-pdf, settings-dashboard
- 14 mobile-layout E2E specs gated in verify-production

## [1.14.33] — 2026-07-12

Audit P4: lazy AI in work-orders, properties/technicians mobile E2E.

### Bundle
- `work-orders.tsx` — dynamic import of `@/lib/ai` (analysis only on user action)
- `verify-production-readiness` gates for dynamic ai import + `pdf-utils.ts`

### E2E
- `properties-mobile-layout.spec.ts`, `technicians-mobile-layout.spec.ts`
- Visible locators in scheduling, technicians-theme-reports, vendor-search global search
- `jobs-bulk-estimate-i18n` uses `visibleTestId` for estimate PDF export

## [1.14.32] — 2026-07-12

Audit P4: vendor PO visible E2E, scheduling mobile spec, pdf-utils tests.

### E2E
- `visibleTestIdMatch` helper for regex testids (vendor PO create-job buttons)
- Visible locators in `work-orders-vendor-po`, `mobile-vendor-po-pdf`, `vendor-search-ai-invoice`, `audit-expanded`
- `scheduling-mobile-layout.spec.ts` — day view on mobile viewport
- `properties-inventory` uses `visibleRow`; command palette uses visible palette scope

### Tests
- `src/lib/pdf-utils.test.ts` — isPdfFile / prefersNoPdfWorker unit coverage

## [1.14.31] — 2026-07-12

Audit P4: lazy work-orders PDF chunk, E2E visible helpers, mobile-layout gates.

### Bundle
- `pdf-utils.ts` — lightweight `isPdfFile` / `prefersNoPdfWorker` without pdf.js
- `work-orders.tsx` — dynamic import of `pdf-extract`, CDN and server probes
- `verify-production-readiness` gates for work-orders pdf-extract + 9 mobile-layout E2E specs

### E2E
- `visibility.ts` — `expectEstimateTitleVisible`, `visibleRow` helpers
- `materials`, `estimate-pdf-release`, `scheduling` specs use visible locators

## [1.14.30] — 2026-07-12

Audit P4: lazy sample seed chunk, reports customers mobile, E2E visible fixes.

### Bundle
- `entity-service.ts` — dynamic import of `mock-data` only when importing sample data
- `verify-production-readiness` gate for static mock-data import

### UI
- **Reports** — customers tab stacks on small screens (`report-customer-card-*`)

### E2E
- `audit-expanded` — visible estimate titles (dual mobile/desktop layout)
- `properties-inventory` — visible property names and material table rows
- `reports-mobile-layout` — customers tab on mobile viewport

## [1.14.29] — 2026-07-12

Audit P4: lazy pdf-ocr chunk, reports mobile profit cards, E2E stability.

### Bundle
- `pdf-extract.ts` — dynamic import of `pdf-ocr` (OCR fallback only when needed)
- `verify-production-readiness` gate for static pdf-ocr import

### UI
- **Reports** — profit tab stacks metrics on small screens (`report-profit-card-*`)

### E2E
- `e2e/reports-mobile-layout.spec.ts` — profit cards on mobile viewport
- Command palette opens via `Control+k`; fleet-expenses uses visible locators

## [1.14.28] — 2026-07-12

Audit P4: fuel log mobile cards, live Stripe edge smoke.

### UI
- **Vehicles** — fuel log card layout on `< md`, `fuel-logs-pagination-mobile`

### Live E2E
- `e2e/stripe-live.spec.ts` — probes `create-subscription-checkout` edge (nightly when Stripe key set)
- `playwright.live.config.ts` + `nightly-live-e2e.yml` pass `VITE_STRIPE_PUBLISHABLE_KEY`

## [1.14.27] — 2026-07-12

Audit P4: mobile cards for materials and expenses, docs sync.

### UI — Mobile cards
- **Materials** (`materials.tsx`) — card layout + `materials-pagination-mobile`; transactions panel unchanged
- **Expenses** (`expenses.tsx`) — card layout + `expenses-pagination-mobile`

### E2E & docs
- `e2e/materials-mobile-layout.spec.ts`, `e2e/expenses-mobile-layout.spec.ts`
- Visible locators in materials, fleet-expenses, audit-expanded specs
- `POST_RELEASE.md` updated to 1.14.26+ with migration list

## [1.14.26] — 2026-07-12

Audit P4 continued: mobile cards for invoices and estimates, a11y scope fix.

### UI — Mobile cards
- **Invoices** (`invoices.tsx`) — card layout + `invoices-pagination-mobile`
- **Estimates** (`estimates.tsx`) — card layout + `estimates-pagination-mobile`

### E2E & a11y
- `e2e/invoices-mobile-layout.spec.ts`, `e2e/estimates-mobile-layout.spec.ts`
- Visible locators for billing actions across estimates/invoices specs
- Axe on `/instructions` scoped to `.instructions-doc`

## [1.14.25] — 2026-07-12

Audit P4: production bundle trim, mobile cards for vendor PO and customers.

### Bundle
- `src/lib/supabase.ts` — dynamic import of `e2e-mock-supabase` (excluded from production chunk)
- `main.tsx` — async bootstrap awaits E2E mock init when `VITE_E2E_MOCK_BACKEND=true`
- `verify-production-readiness` gate for static import + missing migrations

### UI — Mobile cards
- **Vendor PO** (`vendor-po-table.tsx`) — card layout on `< md`; desktop table unchanged
- **Customers** (`customers.tsx`) — card layout + mobile pagination test id

### Tests
- `e2e/customers-mobile-layout.spec.ts`, `e2e/vendor-po-mobile-layout.spec.ts`
- `mobile-smoke.spec.ts` — customers cards + mobile pagination

## [1.14.24] — 2026-07-12

Audit P3: E2E stability after mobile jobs layout, Sentry Session Replay.

### E2E — Jobs dual layout
- `e2e/helpers/visibility.ts` — assert visible text/testids when mobile cards + desktop table both render
- Fix flaky `jobs-customers`, bulk actions, and portal bulk specs after v1.14.23 mobile cards
- New `e2e/jobs-mobile-layout.spec.ts` for small-screen card layout

### Observability
- Sentry Session Replay (`replayIntegration`) — 5% sessions in prod, 100% on errors

## [1.14.23] — 2026-07-12

Audit P2: mobile jobs, PWA icons, tenant cache, Sentry context, Stripe E2E.

### UI — Jobs mobile
- Card layout on screens `< md` instead of horizontal-scroll table
- Desktop table unchanged

### PWA & observability
- PNG icons 192/512 + maskable 512 for Android install
- Clear entity localStorage on company switch and sign-out
- Sentry `setUser` + `company_id` tag; release fallback `dev` not `1.3.0`

### Tests
- Dedicated `e2e/stripe-billing.spec.ts` smoke tests
- `tenant-cache` unit tests

## [1.14.22] — 2026-07-12

Audit fixes: CI, security, PWA offline, observability.

### Hotfix — CI & security
- Fix E2E vendor PO duplicate-file regex (`vendor-po-sample.pdf`)
- Playwright `retries: 2` in CI for flaky specs
- Enable RLS on `rate_limit_buckets` (migration `20260712000001`)
- Security headers on FTP deploy: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`

### Hotfix — PWA & errors
- Service worker v6: cache latest `index.html` for offline cold start (no forced tab reload)
- `entity-service` logs Supabase fallback instead of silent `catch {}`
- Typed `JobCreateCustomerError` for vendor PO → job workflow toasts

## [1.14.21] — 2026-07-12

Wider jobs table cells for three-line text without truncation.

### UI — Jobs list
- Job column `20rem`, customer `14rem`, technician `10rem`
- Up to 3 lines with normal word breaks (`line-clamp-3`, no mid-word breaks)
- Table min-width `1320px` for horizontal scroll on mobile

## [1.14.20] — 2026-07-12

Fix blank page after deploy (stale cached `index.html` / JS chunks).

### Hotfix — PWA cache after deploy
- Service worker v5: do not cache `index.html`; network-only navigation and hashed assets
- Auto-reload once when a lazy chunk fails to load after a new deploy
- `Cache-Control: no-cache` for `index.html` and `sw.js` via `.htaccess`
- Jobs table uses `tableClassName` instead of fragile parent selector

## [1.14.19] — 2026-07-12

Wider jobs table columns with two-line text wrapping.

### UI — Jobs list
- Wider job, customer, and technician columns on `/jobs`
- Title and names wrap to two lines (`line-clamp-2`) instead of truncating
- Slightly wider table min-width for readability on mobile scroll

## [1.14.18] — 2026-07-12

Fix «Создать заказ + смету» when no Supabase customers exist (demo IDs in cache).

### Hotfix — Vendor PO to job workflow
- Resolve customer from Supabase UUID rows only; ignore demo `cust-001` local cache
- Auto-create property-management customer from vendor PO when none exist
- Update PO status by `vendor_po_number` when local `id` differs from Supabase
- PO status update failure no longer blocks job creation success
- Estimate `valid_until` stored as date-only (`YYYY-MM-DD`)

## [1.14.17] — 2026-07-12

Fix «Создать заказ + смету» error for existing Vendor PO records.

### Hotfix — Vendor PO to job workflow
- Update existing PO status to `approved` instead of inserting duplicate row
- Null-safe priority mapping when creating job from vendor PO

## [1.14.16] — 2026-07-11

Fix intermittent Vendor PO PDF parse failures (especially on mobile).

### Hotfix — PDF extract reliability
- Race server extract vs CDN pdf.js on mobile (`Promise.any`) instead of waiting up to 90s for server
- Shorter server timeout (35s) with `supabase.functions.invoke` + session refresh
- Reset CDN pdf.js loader after failure so retries work
- Remove blocking translation from upload path (translation stays lazy in table)
- Pre-warm auth session and server probe on mobile work-orders page

## [1.14.15] — 2026-07-11

Fix Vendor PO problem description translation not running in production.

### Hotfix — Translation auth & retry
- Call `openai-proxy` via `supabase.functions.invoke` with session refresh
- Fall back to fetch with JWT headers when invoke fails
- Start lazy translation only after user auth is ready
- Retry failed translations every 60s; persist Russian to DB and refresh query cache

## [1.14.14] — 2026-07-11

Fix empty «Описание проблемы» column when Russian translation is pending or failed.

### Hotfix — Problem description display
- Show English text as fallback until Russian translation is ready
- Backfill `problem_description` from `service_description` on load
- Retry lazy translation after failure; show «Перевод…» under English while in progress

## [1.14.13] — 2026-07-11

Russian translation for Vendor PO problem description.

### Feature — Problem description translation
- Translate problem description to Russian on PDF upload (with timeout per row)
- Lazy translation in table for existing records without `problem_description_ru`
- Persist translations to Supabase/local cache via `updateVendorPOProblemRu`
- Show «Перевод…» while translation is in progress; Russian only in table cells

## [1.14.12] — 2026-07-11

Fix infinite spinner when uploading Vendor PO PDF.

### Hotfix — Upload hang
- Timeouts on PDF extract (client/server), Supabase save, and duplicate lookups
- Remove blocking `refreshSession()` on every API call (was hanging auth refresh)
- Targeted duplicate-file queries instead of loading all `vendor_po_records`
- User-facing timeout message when upload exceeds limits

## [1.14.11] — 2026-07-11

Deploy workflow: FTP upload before Edge Functions; optional Supabase migration step.

### Hotfix — Deploy FTP
- Upload `dist/` to FTP **before** Edge Function deploy (Docker rate limits no longer block frontend)
- Edge Function deploy is non-blocking (`continue-on-error`)
- Auto-apply vendor PO DB migration via Supabase Management API when token is set

## [1.14.10] — 2026-07-11

Fix Vendor PO upload page crash (null DB fields + missing Supabase columns).

### Phase 151c — Upload crash hardening
- Normalize nullable Supabase fields before table render (`priority`, `work_summary`, etc.)
- Progressive Supabase insert: retry without `problem_description`, then without `source_file_hash`
- Duplicate-file lookup falls back when `source_file_hash` column is missing
- Remote save no longer fails if local cache write fails afterward
- Migration also adds `source_file_hash` if missing

## [1.14.9] — 2026-07-11

Fix Vendor PO upload crash / hang when saving problem description.

### Phase 151b — Upload stability
- Remove blocking OpenAI translation from PDF upload path (translate lazily in table)
- Retry Supabase insert without `problem_description` columns when DB migration not applied yet
- Safer `crypto.subtle` check for PDF hash on restricted browser contexts
- Null-safe priority rendering in vendor PO table
- Migration `20260711000003_vendor_po_problem_description.sql`

## [1.14.8] — 2026-07-11

Vendor PO problem description column with Russian translation.

### Phase 151 — Описание проблемы
- Extract problem text after the last `/` in SERVICE DESCRIPTION
- New table column **Описание проблемы** with Russian translation (OpenAI)
- Click cell to open popup with full translated text
- `problem_description` and `problem_description_ru` columns in `vendor_po_records`
- Excel export includes translated problem description

## [1.14.7] — 2026-07-11

Vendor PO table layout + block duplicate PDF files.

### Phase 150 — Table columns & PDF file dedup
- **Объект** and **Адрес** columns sized for **2-line** text (`line-clamp-2`)
- Reject duplicate PDF by **file name** and **SHA-256 content hash**
- `source_file_hash` column in `vendor_po_records`

## [1.14.6] — 2026-07-11

Block duplicate Vendor PO uploads.

### Phase 149 — Duplicate PO guard
- Reject upload when `vendor_po_number` already exists for the company
- Detect duplicates within the same multi-file batch
- User message: «Наряд 210071-01 уже загружен»
- E2E: re-upload same PDF is rejected

## [1.14.5] — 2026-07-11

Fix Facil-IT Vendor PO service location parsing (e.g. PO 210071-01 Loc # 17900).

### Phase 148 — Facil-IT location object
- Parse `3465 S CHURCH ST Burlington, NC 27215` (street + city without comma between)
- Unified `parseFacilItSection` for flattened Facil-IT PDF text
- Always normalize SERVICE LOCATION block splits (even multiline OpenAI output)
- Fixture: `VendorPO-210071-01.pdf` + extracted text test

## [1.14.4] — 2026-07-11

Vendor PO — fix address parsing and work-scope popup.

### Phase 147 — Address + work scope UX
- Parse OpenAI comma-separated address lines (`123 Main St, Graham, NC 27253`)
- Facil-IT and CD Maintenance comma-line layouts
- Inline fallback for flattened `SERVICE LOCATION` blocks
- Click **Объём работ** cell to open full-text popup (mobile-friendly)

## [1.14.3] — 2026-07-11

Fix iOS Vendor PO PDF read regression — resilient server extract and CDN fallback.

### Phase 146 — PDF extract resilience
- Mobile always tries **server extract** first (no probe-cache skip)
- Refresh Supabase session before Edge Function calls; retry once on 401
- `FileReader` + `arrayBuffer` dual path for base64 upload on iOS
- CDN pdf.js fallback: **jsDelivr** mirror when cdnjs blocked
- Clear server probe cache after extract failure
- Server: validate PDF magic bytes; OpenAI **gpt-4o** fallback when mini fails

## [1.14.2] — 2026-07-11

Vendor PO parser — fix service location address for OpenAI multiline PDF text.

### Phase 145 — Vendor PO address parsing
- Multiline `SERVICE LOCATION` blocks (OpenAI / server extract output)
- CD Maintenance and Facil-IT layouts: street, city, zip on separate lines
- Multi-word city names (e.g. New Bern)
- **213** unit tests

## [1.14.1] — 2026-07-11

Fix Edge Function deploy 413 — remove pdf.js from openai-proxy.

### Phase 144 — Lightweight extract-pdf-text
- `openai-proxy` reverted to slim bundle (no pdf.js — was 31 MB, caused 413)
- `extract-pdf-text` uses **OpenAI-only** PDF text extraction (no pdfjs-dist)
- Client calls `extract-pdf-text` only (not openai-proxy extractPdf)
- **211** unit tests

## [1.14.0] — 2026-07-11

iOS Vendor PO PDF — CDN pdf.js fallback when Supabase Edge Functions missing.

### Phase 143 — iOS PDF CDN fallback
- Production Supabase had **no Edge Functions deployed** (404 on openai-proxy)
- iPhone: probe server availability, then **CDN pdf.js 3.11** (cdnjs), then bundled legacy
- Prefetch CDN pdf.js on work-orders mount for touch devices
- Parse Supabase `NOT_FOUND` JSON errors; clearer server-not-deployed toast
- New workflow `deploy-edge-functions.yml` (needs `SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_REF`)
- **211** unit tests

## [1.13.9] — 2026-07-11

iOS Vendor PO PDF — route mobile extract through deployed openai-proxy.

### Phase 142 — Mobile PDF via openai-proxy
- `openai-proxy` Edge Function: `extractPdf` + `pdfBase64` mode (pdf.js + OpenAI OCR fallback)
- iPhone/iPad: server-only PDF extract (no broken client pdf.js retry loop)
- Client tries `openai-proxy` first, then `extract-pdf-text`; sends `apikey` + auth headers
- Clearer toast when Edge Function not deployed (404)
- **211** unit tests

## [1.13.8] — 2026-07-11

iOS Safari Vendor PO PDF — server-side extract fallback + pdf.js legacy build.

### Phase 141 — iOS PDF server fallback
- New Edge Function `extract-pdf-text`: server-side pdf.js legacy extract (auth + rate limit)
- iPhone/iPad: server extract first in production; client legacy pdf.js as fallback
- Client pdf.js switched to **legacy build** (`isEvalSupported: false`) for Safari CSP compatibility
- Legacy `pdf.worker.min.mjs` copied to `public/` for same-origin worker URL
- **210** unit tests

## [1.13.7] — 2026-07-11

iOS Safari PDF read fix — static pdf.js bundle, no worker on touch devices.

### Phase 140 — iOS WebKit PDF extract
- `pdfjs-dist` static import (no lazy chunk load failures on iOS Safari)
- Touch devices: `disableWorker` only — never spawn pdf.js module worker
- Always set `workerSrc` (pdf.js requires it even with `disableWorker: true`)
- `warmUpPdfJs()` on work-orders mount; `FileReader` fallback when `arrayBuffer()` fails
- Version badge on work-orders page (verify deploy from Vendor PO tab)
- **208** unit tests

## [1.13.6] — 2026-07-11

iOS Vendor PO PDF import hardening + dashboard version badge.

### Phase 139 — iOS PDF import hardening
- PDF worker URL always resolved from site origin (not current route path)
- Mobile/iOS: `disableWorker` first, `FileReader` fallback for `arrayBuffer()`
- Per-file PDF extract errors (no whole-batch failure); clearer extract vs parse toasts
- Service worker v4: network-first for `/assets/*` hashed bundles (no stale PDF code)
- Truncate large vendor PO text fields before localStorage save
- Mobile E2E: iPhone viewport uploads `vendor-po-210072-01.pdf`

### Phase 138 — Dashboard version badge
- Main dashboard shows app version + UTC build timestamp (`VITE_BUILD_TIME` from CI)
- Deploy workflows inject build time on FTP and GitHub Pages builds

## [1.13.5] — 2026-07-11

Production bug-fix audit — data integrity, notifications, PWA, security.

### Phase 136 — Facil-IT Vendor PO PDF fix (mobile)
- PDF extract: same-origin `pdf.worker.min.mjs` (no CDN) for iOS Safari / FTP hosts
- Facil-IT parser: reversed pdf.js text (client PO, priority, NTE, service location)
- Vendor PO upload: clearer save vs extract error mapping; console log on unknown failures
- E2E: user fixture `vendor-po-210072-01.pdf` (Walgreens PO 210072-01)
- **202** unit tests, **38** E2E vendor PO specs

### Phase 137 — Vendor PO save resilience
- `getErrorMessage()` for Supabase PostgrestError objects (no more `[object Object]` → parse error)
- Vendor PO save: preserve id on upsert, `maybeSingle` + fetch fallback
- Local cache fallback when Supabase save/load fails; merged list in `getVendorPOs`
- iOS Safari: `disableWorker` PDF fallback when worker load fails
- **205** unit tests

### Phase 131 — Audit bug fixes
- Entity cache: `mergeStoreById` preserves multi-tenant offline data on sync
- `saveEntity` / payment / fuel / time entry: rollback local cache on Supabase failure
- Notifications: webhook failures enqueue for retry instead of dropping
- Email Edge Function: HTML-escape notification body/subject (XSS)
- PWA: base-path aware service worker + manifest for GitHub Pages
- Dispatch: await job status save before sending notifications
- Portal prefs: rollback UI on RPC failure
- Offline sync: normalize `start`/`end` vs `start_time`/`end_time` on clock-out
- Auth: restore session on `SIGNED_IN` / `TOKEN_REFRESHED` in other tabs
- Queries: disable entity fetches until company is loaded (no `comp-001` leak)
- **189** unit tests, **230+** E2E tests (mock)

### Phase 132 — System hardening
- Removed legacy GitHub Pages workflows (`static.yml`, `jekyll-gh-pages.yml`)
- `/instructions`: markdown rendering, table of contents, E2E coverage
- Removed `comp-001` fallback across hooks and pages; `requireCompanyId` guard
- OpenAI: browser API key disabled in production (proxy/E2E mock only)
- Supabase incremental migrations (`supabase/migrations/`)
- Unit tests: billing, payment, stripe, inventory, vendor-po services
- Live E2E smoke: instructions page + login link
- Docs sync: RELEASE 1.13.5, UPGRADE schema `2026-07-11d`

### Phase 134 — Audit phase 3
- Client-side table pagination: `useTablePagination` + `TablePagination` on customers, jobs, invoices, estimates, expenses, materials, fuel logs
- Settings refactor: `SettingsIntegrationsPanel` + `SettingsSystemPanel` extracted from `settings.tsx`
- E2E: `@axe-core/playwright` axe scans (`a11y-axe.spec.ts`), live smoke extended for PWA/guide static assets
- a11y: document `<title>` in `index.html`, Radix login tabs expose `TabsContent` targets for ARIA
- Vendor PO PDF import: robust pdf.js worker on iOS/Safari, clearer errors, relaxed PO text detection
- i18n: pagination labels (RU/EN)
- **193** unit tests, **233+** E2E tests (mock)

### Phase 135 — Roadmap to 10/10
- Server-side table pagination: `listEntitiesPage` + `useServerEntityTable` on customers, jobs, invoices
- Vendor PO scanned PDFs: OpenAI vision OCR fallback (`pdf-ocr.ts`, `openai-proxy` `images[]` support)
- QuickBooks integration card (coming soon) in Settings → Integrations
- Operator: `OPERATOR_RUNBOOK.md`, `npm run verify:operator:prod` checklist script
- E2E: `mobile-smoke.spec.ts` (iPhone 13), axe + pagination coverage on jobs/invoices/settings
- **201** unit tests, **237+** E2E tests (mock)

### Hotfix — supabase-smoke `check_rate_limit`
- Smoke script calls `check_rate_limit` with **service role** key (anon always gets 404)
- Migration `20260711000002_check_rate_limit.sql`; add `SUPABASE_SERVICE_ROLE_KEY` to GitHub Secrets

### Hotfix — CI gates & verify:production
- `verify:production` gate aligned with `supabase-smoke.yml` (no longer requires `verify:operator` step)
- `ci.yml` smoke job: service role + optional RPC/edge flags
- `verify:operator` respects `SMOKE_RPC_OPTIONAL` / `SMOKE_EDGE_FUNCTIONS_OPTIONAL`

### Hotfix — Vendor PO PDF on iOS / FTP hosting
- pdf.js: drop manual `workerPort` (breaks on Safari + `.mjs` on FTP); CDN worker on mobile
- Standard fonts / cmaps from CDN; retry after worker reset
- Clearer error mapping: worker failures → `pdfExtractFailed` toast

### Phase 133 — Audit phase 2
- English user guide: `INSTRUCTIONS.en.md` + locale-based `/instructions` loading
- Entity list pagination: `ENTITY_LIST_LIMIT` (500) on Supabase fetches
- Operator script: `npm run deploy:edge-functions`
- `POST_RELEASE.md` updated for 1.13.5, migrations, FTP deploy
- verify:production gates: migrations, EN guide, no legacy workflows, no `comp-001` leak
- E2E: `a11y-smoke.spec.ts`, EN instructions locale test

## [1.13.4] — 2026-07-10

Lazy recharts chunks and live-backend E2E smoke.

### Phase 130 — Lazy recharts & live E2E
- Dashboard and reports pages lazy-load recharts via `dashboard-charts` and `reports-recharts` chunks
- `chart-prefetch.ts` warms lazy chart modules after app shell load
- `playwright.live.config.ts` + `live-backend-smoke.spec.ts` for nightly live Supabase E2E
- verify-production: lazy chart chunk gates and live E2E workflow checks
- **230** E2E tests (mock), **3** live smoke tests (nightly when secrets set), **168** unit tests

## [1.13.3] — 2026-07-10

Chart prefetch and registry-driven E2E sync.

### Phase 129 — Chart prefetch & registry E2E sync
- `chart-prefetch.ts` warms recharts, dashboard, and reports after app shell load
- verify-production: registry keys must match audit-expanded E2E one-to-one
- Nightly smoke workflow runs `verify:operator` when secrets are set
- **230** E2E tests, **169** unit tests

## [1.13.2] — 2026-07-10

Lazy bundle loading and audit action registry.

### Phase 128 — Performance & audit registry
- `pdf-extract.ts` lazy-loads `pdfjs-dist` only on PDF upload
- `export.ts` lazy-loads `xlsx` only on Excel export click
- `audit-action-registry.ts` — single source of truth for audit action keys
- verify-production: lazy-load and registry gates
- **230** E2E tests, **167** unit tests

## [1.13.1] — 2026-07-10

CI hardening: E2E sharding and Supabase smoke.

### Phase 127 — CI E2E sharding & live smoke
- CI: Playwright E2E split across 4 parallel shard jobs (~4× faster)
- CI: `supabase-smoke` job on `main` when secrets are set
- Nightly `supabase-smoke.yml` cron schedule (06:00 UTC)
- Deploy: smoke step no longer `continue-on-error` (fails when live smoke fails)
- verify-production: CI sharding and smoke workflow gates
- **230** E2E tests, **164** unit tests

## [1.13.0] — 2026-07-10

Field-ops milestone wrap-up with computed gates.

### Phase 126 — Field-ops milestone complete
- `FIELD_OPS_MILESTONE_AUDIT` computed from inventory, fleet, expense, fuel, dispatch, and offline sync sub-gates
- Settings exposes `stripe_webhook_audit` and `audit_i18n` platform checks
- verify-production: `STRIPE_WEBHOOK_AUDIT`, `AUDIT_I18N_COVERAGE`, `INTEGRATION_PROBES_AUDIT` gates
- Split field-ops vs platform-ops visibility checks in verify-production
- **230** E2E tests, **164** unit tests

## [1.12.6] — 2026-07-10

Sample import, portal requests, estimate create, and entity update audit visibility.

### Phase 125 — Remaining platform audit gates
- Settings exposes `sample_import_audit`, `portal_requests_audit`, `estimate_create_audit`, `entity_update_audit`
- verify-production gates and audit-expanded E2E coverage
- **230** E2E tests, **164** unit tests

## [1.12.5] — 2026-07-10

Billing, team invite, and invoice audit visibility.

### Phase 124 — Billing, team invite & invoice audit gates
- Settings audit checklist exposes `billing_plan_audit`, `team_invite_audit`, `invoice_audit` checks
- verify-production gates and audit-expanded E2E coverage
- **230** E2E tests, **164** unit tests

## [1.12.4] — 2026-07-10

Company switch, invite, and bulk ops audit visibility.

### Phase 123 — Company switch, invite & bulk ops audit gates
- Settings audit checklist exposes `company_switch_audit`, `invite_audit`, `bulk_ops_audit` checks
- verify-production: `COMPANY_SWITCH_AUDIT`, `INVITE_AUDIT`, `BULK_OPS_AUDIT` gates and audit-expanded E2E coverage
- Fix react-hooks exhaustive-deps warnings in notification hub and settings metrics
- **230** E2E tests, **164** unit tests

## [1.12.3] — 2026-07-10

Field-ops company profile and portal audit visibility.

### Phase 122 — Company profile & portal audit gates
- Settings audit checklist exposes `company_profile_audit` and `portal_audit` checks
- verify-production: `COMPANY_PROFILE_AUDIT`, `PORTAL_AUDIT` gates and audit-expanded E2E coverage
- **230** E2E tests, **164** unit tests

## [1.12.2] — 2026-07-10

Field-ops onboarding and vendor PO audit visibility.

### Phase 121 — Onboarding & vendor PO audit gates
- Settings audit checklist exposes `onboarding_audit` and `vendor_po_audit` checks
- verify-production: `ONBOARDING_AUDIT`, `VENDOR_PO_AUDIT` gates and audit-expanded E2E coverage
- **230** E2E tests, **164** unit tests

## [1.12.1] — 2026-07-10

Field-ops expense and fuel log audit visibility.

### Phase 120 — Expense & fuel log audit gates
- Settings audit checklist exposes `expense_audit` and `fuel_log_audit` checks
- verify-production: `EXPENSE_AUDIT`, `FUEL_LOG_AUDIT` gates and audit-expanded E2E coverage
- **230** E2E tests, **164** unit tests

## [1.12.0] — 2026-07-10

Field-ops audit milestone kickoff.

### Phase 119 — Field-ops milestone
- Platform audit: `tech_offline_sync_audit`, `field_ops_milestone_audit` gates
- Settings audit checklist exposes inventory, fleet, dispatch, and field-ops milestone checks
- verify-production: technician offline sync and inventory audit log E2E gates
- **230** E2E tests, **164** unit tests

## [1.11.2] — 2026-07-10

Hub skip CSV summary and email channel export.

### Phase 118 — Hub skip CSV email channel
- Skip log CSV prepends `# summary: N skipped (X email · Y SMS)` header
- E2E: email skip CSV export includes channel column and email address
- E2E: SMS skip CSV export validates summary line
- Platform audit: `notification_hub_email_skip_csv_audit` gate
- **230** E2E tests, **163** unit tests

## [1.11.1] — 2026-07-10

Hub skip log channel filtering.

### Phase 117 — Hub skip channel filter
- Email/SMS tabs filter skip log entries by channel via `getNotificationSkipLogFiltered()`
- Channel tabs show matching skips alongside queued notifications
- E2E: email tab shows only email skips; SMS tab shows only SMS skips
- Platform audit: `notification_hub_skip_channel_filter_audit` gate
- **229** E2E tests, **162** unit tests

## [1.11.0] — 2026-07-10

Notification milestone complete.

### Phase 116 — Notification milestone wrap-up
- E2E: hub Skipped tab shows dispatch ETA and invoice email opt-out entries
- Platform audit: `notification_hub_eta_email_skip_audit`, `notification_hub_invoice_email_skip_audit`, `notification_milestone_audit` gates
- Settings audit checklist exposes all notification milestone checks
- **228** E2E tests, **161** unit tests

## [1.10.17] — 2026-07-10

Hub dispatch and scheduling email skip visibility.

### Phase 115 — Hub email skip coverage
- E2E: hub Skipped tab shows dispatch scheduled email opt-out entry
- E2E: hub Skipped tab shows scheduling email opt-out entry
- Platform audit: `notification_hub_dispatch_email_skip_audit`, `notification_hub_scheduling_email_skip_audit` gates
- **226** E2E tests, **161** unit tests

## [1.10.16] — 2026-07-10

Notification hub skip summary with email/SMS breakdown.

### Phase 114 — Hub skip summary breakdown
- `getNotificationSkipLogStats()` — total, email, and SMS skip counts
- Hub summary: `{skipped} skipped ({emailSkips} email · {smsSkips} SMS)`
- E2E: estimate email skip + dispatch SMS skip shows summary `2 skipped (1 email · 1 SMS)`
- Platform audit: `notification_hub_skip_summary_audit` gate
- **224** E2E tests, **161** unit tests

## [1.10.15] — 2026-07-10

Portal email badge sync and hub SMS skip CSV export.

### Phase 113 — Portal email badge & SMS skip CSV
- E2E: staff CRM email/SMS opt-out sync shows portal opt-out badges
- E2E: hub skip log CSV export includes SMS channel and phone
- Platform audit: `portal_email_opt_out_badge_audit`, `notification_hub_sms_skip_csv_audit` gates
- **223** E2E tests, **160** unit tests

## [1.10.14] — 2026-07-10

Portal SMS opt-out badge and hub scheduling SMS skip log.

### Phase 112 — Portal badge & hub scheduling skip
- Customer portal: email/SMS opt-out status badges in notification prefs card
- E2E: portal SMS opt-out badge by default; email badge when disabled
- E2E: hub Skipped tab shows scheduling SMS opt-out entry
- Platform audit: `portal_sms_opt_out_badge_audit`, `notification_hub_scheduling_sms_skip_audit` gates
- **222** E2E tests, **160** unit tests

## [1.10.13] — 2026-07-10

Staff CRM SMS opt-out badge and hub dispatch ETA SMS skip log.

### Phase 111 — SMS badge & hub ETA skip
- Customers table: SMS opt-out badge when SMS notifications disabled
- E2E: default SMS badge visible; enabling SMS removes badge
- E2E: hub Skipped tab shows dispatch ETA SMS opt-out entry
- Platform audit: `staff_customer_sms_badge_audit`, `notification_hub_eta_sms_skip_audit` gates
- **219** E2E tests, **160** unit tests

## [1.10.12] — 2026-07-10

Portal SMS prefs sync and hub estimate/invoice SMS skip log.

### Phase 110 — Portal SMS sync & hub SMS skip sources
- E2E: staff CRM ↔ portal SMS notification preference sync (cust-002)
- E2E: hub Skipped tab shows estimate and invoice SMS opt-out entries
- Platform audit: `portal_sms_notify_sync_audit`, `notification_hub_estimate_invoice_sms_skip_audit` gates
- **216** E2E tests, **160** unit tests

## [1.10.11] — 2026-07-10

Dispatch ETA SMS E2E and invoice SMS queue coverage.

### Phase 109 — Dispatch ETA SMS E2E
- E2E: dispatch `in_progress` skips customer ETA SMS by default (SMS opt-out)
- E2E: dispatch `in_progress` queues ETA SMS when SMS enabled via customer form
- E2E: invoice send queues customer SMS when SMS enabled via customer form
- Platform audit: `dispatch_eta_sms_audit` gate
- **212** E2E tests, **160** unit tests

## [1.10.10] — 2026-07-10

Estimate and invoice customer SMS with opt-out respect.

### Phase 108 — Estimate & invoice SMS opt-out
- `notifyEstimateSentSms` / `notifyInvoiceSentSms` with SMS templates (EN/RU)
- Estimates and invoices pages send customer SMS when phone present
- E2E: estimate/invoice SMS skip (default) and estimate SMS queued when enabled
- Platform audit: `estimate_invoice_sms_audit` gate
- **209** E2E tests, **160** unit tests

## [1.10.9] — 2026-07-10

Scheduling customer SMS E2E and hub SMS skip visibility.

### Phase 107 — Scheduling SMS E2E
- E2E: scheduling skips customer SMS by default (SMS opt-out)
- E2E: scheduling queues customer SMS when enabled via customer form
- E2E: hub Skipped tab shows SMS opt-out reason after dispatch skip
- Platform audit: `scheduling_customer_sms_audit` gate
- **206** E2E tests, **157** unit tests

## [1.10.8] — 2026-07-10

Customer SMS notifications with opt-out respect in dispatch and scheduling.

### Phase 106 — Customer SMS opt-out
- `notifyCustomerJobScheduledSms` / `notifyCustomerEtaSms` respect `customerAllowsNotification(..., 'sms')`
- Dispatch and scheduling send customer SMS when phone present and SMS enabled
- Hub skipped tab: channel-specific reason labels (email vs SMS)
- E2E: dispatch SMS skip (default opt-out) and SMS queued when enabled via customer form
- Platform audit: `customer_sms_opt_out_audit` gate
- **203** E2E tests, **157** unit tests

## [1.10.7] — 2026-07-10

Notification hub skip log operator export and clear.

### Phase 105 — Skip log operator ops
- `exportNotificationSkipLogCsv()` — CSV download from Settings hub
- Hub buttons: export skip log, clear skip log
- E2E: export CSV and clear skip log after estimate opt-out
- Platform audit: `notification_hub_skip_ops_audit` gate
- **201** E2E tests, **153** unit tests

## [1.10.6] — 2026-07-10

Notification hub skip log for customer email opt-out.

### Phase 104 — Notification hub skip log
- `notification-skip-log` module records opt-out skips locally
- Settings hub: Skipped tab, summary count, opt-out reason label
- E2E: estimate send opt-out appears in hub skipped filter
- Platform audit: `notification_hub_skip_log_audit` gate
- **200** E2E tests, **151** unit tests

## [1.10.5] — 2026-07-10

Bidirectional notification prefs sync — portal → staff CRM.

### Phase 103 — Portal → staff notify sync
- E2E: portal email opt-out syncs to staff CRM badge and customer form
- Settings audit checklist: `portal_staff_notify_sync_audit`
- Platform audit: `portal_staff_notify_sync_audit` gate
- **199** E2E tests, **149** unit tests

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
