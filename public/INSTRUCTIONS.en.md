# HandymanOS AI — User Guide & System Overview

**Document version:** 1.13.5  
**Platform:** Web application (PWA) for handyman, property maintenance, and field-service businesses.  
**In the app:** **Settings → System → User guide** or route `/instructions`

---

## Table of contents

1. [System overview](#1-system-overview)
2. [Production mode](#2-production-mode)
3. [Roles and access](#3-roles-and-access)
4. [Quick start](#4-quick-start)
5. [Application modules](#5-application-modules)
6. [Customer portals](#6-customer-portals)
7. [Technician mobile app](#7-technician-mobile-app)
8. [Onboarding and invites](#8-onboarding-and-invites)
9. [UI features](#9-ui-features)
10. [Integrations](#10-integrations)
11. [Subscription plans](#11-subscription-plans)
12. [Security and audit](#12-security-and-audit)
13. [Testing and deployment](#13-testing-and-deployment)

---

## 1. System overview

**HandymanOS AI** is an enterprise SaaS platform for companies that perform repairs, property maintenance, and related field services. It combines CRM, job operations, finance, inventory, fleet, dispatch, and AI automation in one interface.

### Key capabilities

| Area | What the system provides |
|------|--------------------------|
| Operations | Jobs, work orders, scheduling, Kanban dispatch, routes |
| Sales | Estimates, smart pricing engine, invoice conversion |
| Finance | Invoices, Stripe payments, expenses, reports, job margins |
| Resources | Technicians, materials, vehicles, fuel logs |
| Customers | CRM, properties, self-service portals |
| AI | Work order import, PDF/email/photo analysis, business assistant |
| Field work | Mobile technician UI, offline sync, GPS |
| SaaS | Multi-tenancy, roles, subscriptions, Supabase RLS |

### Tech stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS 4
- **State:** TanStack Query, React Hook Form, Zod
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payments:** Stripe Checkout (invoices and subscriptions)
- **Maps:** Google Maps API (dispatch, routing)
- **AI:** OpenAI via Edge Function proxy (local fallbacks when OpenAI is not configured)

---

## 2. Production mode

HandymanOS AI **requires Supabase**. Without `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, the app shows a configuration screen.

- Data in PostgreSQL with **Row Level Security (RLS)** scoped by `company_id`
- Supabase Auth (signup, login, team invites)
- Hybrid cache: reads mirrored to `localStorage` for offline resilience (PWA)
- Edge Functions: Stripe, OpenAI, email, SMS, webhooks
- Sample data import: **Settings → System → Import sample data**

Deployment guides: [DEPLOYMENT.md](./DEPLOYMENT.md), FTP/subdomain: [DEPLOY-FTP.md](./DEPLOY-FTP.md)

---

## 3. Roles and access

| Role | Modules | Default route |
|------|---------|---------------|
| **Owner** | All modules | `/dashboard` |
| **Admin** | Dashboard, jobs, work orders, estimates, CRM, scheduling, dispatch, technicians, inventory, fleet, expenses, invoices, reports, AI, settings | `/dashboard` |
| **Dispatcher** | Dashboard, jobs, work orders, estimates, customers, properties, scheduling, dispatch, AI | `/dashboard` |
| **Technician** | Jobs (limited), scheduling, mobile `/tech` | `/tech` |
| **Accountant** | Dashboard, invoices, expenses, reports, customers | `/dashboard` |
| **Customer** | Customer portal | `/portal/customer` |

**Owner onboarding** (6 steps) is required only for **Owner**. Invited staff skip the company setup wizard.

---

## 4. Quick start

1. Open the deployed URL (e.g. `https://handy.readyfixnc.com/`)
2. **Sign up** as owner or **sign in**
3. Complete the **6-step onboarding** (company profile, services, materials, team)
4. Optional: **Settings → System → Import sample data**
5. Explore modules from the sidebar or **⌘K** command palette

### First-time Supabase setup (operator)

1. Run full `supabase/schema.sql` in Supabase SQL Editor
2. If login fails with auth errors, run `supabase/migrations/20260711000001_auth_provision_owner.sql`
3. Deploy Edge Functions: `npm run deploy:edge-functions` (see [DEPLOYMENT.md](./DEPLOYMENT.md))
4. Configure GitHub Secrets / hosting env vars per [POST_RELEASE.md](./POST_RELEASE.md)

---

## 5. Application modules

| Route | Module | Description |
|-------|--------|-------------|
| `/dashboard` | Executive dashboard | Revenue, profit, open jobs, charts |
| `/jobs` | Jobs | CRM jobs, status, profitability |
| `/work-orders` | Work orders | AI import (PDF/email/photo), Vendor PO tab |
| `/estimates` | Estimates | Create, send, convert to invoices |
| `/invoices` | Invoices | Billing, Stripe pay, PDF export |
| `/customers` | Customers | CRM, notification preferences |
| `/properties` | Properties | Sites linked to customers |
| `/scheduling` | Scheduling | Calendar, technician availability |
| `/dispatch` | Dispatch | Kanban board, ETA notifications |
| `/technicians` | Technicians | Employee roster, labor costs |
| `/materials` | Materials | Inventory, markup, low-stock alerts |
| `/vehicles` | Fleet | Vehicles, fuel logs |
| `/expenses` | Expenses | Company expenses by category |
| `/reports` | Reports | Financial and operational reports |
| `/ai-assistant` | AI assistant | Natural-language business Q&A |
| `/settings` | Settings | Company, billing, integrations, audit |
| `/instructions` | User guide | This document in the app |

### Vendor PO (CD Maintenance format)

**Work Orders → Vendor PO** tab: upload PDF purchase orders. The system parses PO number, location, NTE amount, and service description, then lets you create jobs from parsed records.

---

## 6. Customer portals

- **Customer portal** (`/portal/customer`) — estimates, invoices, job requests
- **Property portal** (`/portal/property`) — property-manager view

Portals use magic-link tokens and server-side RPCs (no direct table access).

---

## 7. Technician mobile app

Route **`/tech`** — simplified mobile UI for technicians:

- Today's jobs, navigation links
- Clock in/out, photos, notes
- Offline queue sync when connectivity returns

---

## 8. Onboarding and invites

- **Owner onboarding:** 6 steps at `/onboarding`
- **Team invites:** Settings → Team — email invite with role (admin, dispatcher, technician, accountant)
- **Technician lite onboarding:** `/tech-onboarding` for field staff

---

## 9. UI features

- **Dark / light theme** — Settings or header toggle
- **EN / RU localization** — language switcher
- **Command palette** — ⌘K / Ctrl+K quick navigation
- **Company switcher** — multi-company membership
- **Notification hub** — email/SMS queue, skip log export
- **PWA** — installable, service worker for offline shell

---

## 10. Integrations

Configure in **Settings → Integrations** and GitHub/hosting secrets:

| Integration | Env / secret | Purpose |
|-------------|--------------|---------|
| Supabase | `VITE_SUPABASE_*` | Required backend |
| Stripe | `VITE_STRIPE_*`, Edge Functions | Invoice & subscription checkout |
| Google Maps | `VITE_GOOGLE_MAPS_API_KEY` | Dispatch map |
| OpenAI | Edge Function `openai-proxy` | AI features (no browser API key in production) |
| Email | `send-notification` Edge Function | Customer/staff notifications |
| SMS | `send-sms` Edge Function | ETA and scheduling SMS |
| Sentry | `VITE_SENTRY_DSN` | Error monitoring |

**QuickBooks** — planned (shown as “Coming Soon” in settings).

Platform health: **Settings → System** — audit score, integration probes, service worker status.

---

## 11. Subscription plans

| Plan | Price (USD/mo) | Typical use |
|------|----------------|-------------|
| Starter | $49 | Small crew |
| Professional | $99 | Growing company |
| Enterprise | $199 | Multi-team operations |

Upgrade via **Settings → Billing** (Stripe Checkout when configured).

---

## 12. Security and audit

- **RLS** on all tenant tables (`company_id`)
- **Audit log** — 44+ tracked actions (Settings → System)
- **Portal RPC enforcement** — tokens validated server-side
- **Rate limiting** on OpenAI proxy Edge Function

---

## 13. Testing and deployment

```bash
npm run verify:production   # static readiness gates
npm run test                  # unit tests
npm run test:e2e              # Playwright (mock Supabase)
npm run smoke:supabase        # live Supabase smoke
```

**Production URL example:** https://handy.readyfixnc.com/  
**Current version:** 1.13.5

For operator checklist after deploy, see [POST_RELEASE.md](./POST_RELEASE.md).
