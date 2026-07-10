# Changelog

All notable changes to HandymanOS AI are documented here.

## [Unreleased]

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
