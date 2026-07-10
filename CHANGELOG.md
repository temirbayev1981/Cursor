# Changelog

All notable changes to HandymanOS AI are documented here.

## [Unreleased]

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
