# HandymanOS AI — Release 1.6.0

Report profit/financial PDF i18n, jobs on-hold tab, and customer portal EN approve/decline on **1.5.7**.

## What's new in 1.6.0

- Jobs **On Hold** filter tab with `jobs-tab-on-hold`
- Report PDF i18n E2E for profit and financial tabs
- Customer portal English approve/decline estimate E2E
- `seedOnHoldJob()` and `resetEstimateStatus()` E2E helpers
- E2E: 127 tests total across 30 spec files

## Test coverage

- Unit: **83**
- E2E: **127** (30 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-64-profit-pdf-on-hold-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#56` → **#57**
