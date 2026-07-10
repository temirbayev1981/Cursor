# HandymanOS AI — Release 1.4.5

Settings billing/team and dashboard analytics E2E on **1.4.4**.

## What's new in 1.4.5

- E2E: billing upgrade to enterprise (demo mode)
- E2E: team invite form + pending invites list
- E2E: dashboard stat cards, charts, recent jobs (80 tests total)
- `data-testid` on billing plans, team invite, dashboard sections

## Test coverage

- Unit: **83**
- E2E: **80** (22 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-53-settings-dashboard-e2e-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#45` → **#46**
