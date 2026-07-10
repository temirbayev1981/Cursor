# Changelog

All notable changes to HandymanOS AI are documented here.

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
