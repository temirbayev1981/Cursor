# HandymanOS AI

Enterprise handyman and property maintenance business management platform with AI-powered automation.

## Features

- **Executive Dashboard** — Revenue, profit, job metrics, and interactive charts
- **AI Work Order Import** — PDF, email, and photo analysis with automatic data extraction
- **Smart Estimating Engine** — Historical learning, service catalog, pricing multipliers
- **Labor Cost Calculator** — True hourly cost with taxes, insurance, benefits, overhead
- **Material Management** — Inventory tracking, markup pricing, low-stock alerts
- **Vehicle & Fuel Tracking** — Fleet management, fuel logs, cost-per-mile
- **Job Profitability Engine** — Per-job revenue, costs, and margin visualization
- **Scheduling & Route Optimization** — Calendar views, technician availability, Google Maps integration
- **CRM** — Customers, properties, communication history
- **Invoicing & Payments** — Stripe-ready billing with PDF generation
- **AI Business Assistant** — Natural language business intelligence
- **Reporting** — Financial, profit, technician, and service reports with export
- **Portals** — Property manager and customer self-service portals
- **Mobile Technician App** — Job view, navigation, photos, time tracking, GPS
- **Onboarding Wizard** — 6-step company setup
- **Multi-tenant SaaS** — Subscription plans, roles, RLS security

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4 |
| UI | shadcn/ui patterns, Framer Motion, Recharts |
| State | React Query, React Hook Form, Zod |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| Payments | Stripe (architecture ready) |
| Maps | Google Maps API (integration ready) |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Verify release & production readiness
npm run verify:release
npm run verify:production

# Run E2E tests
npm run test:e2e
```

Open [http://localhost:5173](http://localhost:5173) and sign in with any credentials in demo mode.

**Current version:** 1.2.7 — see [RELEASE.md](./RELEASE.md) and [CHANGELOG.md](./CHANGELOG.md).

Copy `.env.example` to `.env.local` to connect Supabase, Stripe, and other integrations.

## Demo Mode

Without Supabase credentials, the app runs in **demo mode** with realistic sample data. To connect a live backend, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn-style primitives
│   ├── shared/       # StatCard, DataTable, badges
│   └── layout/       # Sidebar, AppLayout
├── contexts/         # Auth provider
├── data/             # Demo/mock data
├── lib/              # Utils, AI engine, Supabase client
├── pages/            # All feature modules
└── types/            # TypeScript definitions
supabase/
└── schema.sql        # Full database schema with RLS
```

## Routes

| Path | Module |
|------|--------|
| `/dashboard` | Executive dashboard |
| `/jobs` | Job management |
| `/work-orders` | AI work order import |
| `/estimates` | Smart estimating |
| `/customers` | CRM |
| `/properties` | Property management |
| `/scheduling` | Calendar & routing |
| `/technicians` | Employee costing |
| `/materials` | Inventory |
| `/vehicles` | Fleet & fuel |
| `/expenses` | Expense tracking |
| `/invoices` | Billing |
| `/reports` | Analytics |
| `/ai-assistant` | AI business consultant |
| `/settings` | Configuration |
| `/onboarding` | Owner setup wizard (6 steps) |
| `/tech-onboarding` | Technician lite setup (invite flow) |
| `/tech` | Mobile technician view |
| `/portal/access` | Portal magic-link entry |
| `/portal/property` | Property manager portal |
| `/portal/customer` | Customer portal |

See [CHANGELOG.md](./CHANGELOG.md) for release history.

## Production readiness

| Check | Command / location |
|-------|-------------------|
| Release gate | `npm run verify:release` |
| E2E smoke tests | `npm run test:e2e` |
| Platform audit | Settings → System (score ≥ 8.5 with live integrations) |
| Deploy guide | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Release checklist | [RELEASE.md](./RELEASE.md) |

Current version: **1.1.0**

## Security

- Row Level Security on all tables
- Role-based access: Owner, Admin, Dispatcher, Technician, Accountant, Customer
- Company-scoped data isolation
- Audit logging

## Subscription Plans

- **Starter** — $49/mo — 5 users, 100 jobs/month
- **Professional** — $99/mo — 15 users, AI features, route optimization
- **Enterprise** — $199/mo — Unlimited, white label, API access

## License

Proprietary — HandymanOS AI
