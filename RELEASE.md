# HandymanOS AI — Release 1.5.0

Release consolidating Phases 50–55 on **1.4.7**.

## What's new in 1.5.0

- **Estimate PDF export** — print-ready preview per estimate row
- E2E: estimate PDF title, total, line items (92 tests total)
- Consolidates E2E coverage from Phases 50–55

## Included since 1.4.2

| Phase | Focus |
|-------|--------|
| 50 | Properties & inventory E2E |
| 51 | Technicians, theme, reports E2E |
| 52 | Dispatch DnD, AI chat, reports PDF |
| 53 | Settings billing/team, dashboard |
| 54 | Onboarding, invite errors, vendor export |
| 55 | Vendor multi-site, search, invoice send |

## Test coverage

- Unit: **83**
- E2E: **92** (25 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-56-estimate-pdf-release-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#48` → **#49**
