# HandymanOS AI — Release 1.5.7

Cancelled jobs tab, report PDF tabs, and customer portal EN on **1.5.6**.

## What's new in 1.5.7

- Jobs **Cancelled** filter tab for bulk-cancelled and cancelled jobs
- Report PDF i18n E2E for services and customers tabs
- Customer portal English locale E2E with stable testids
- E2E: 120 tests total across 30 spec files

## Test coverage

- Unit: **83**
- E2E: **120** (30 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-63-cancelled-tab-report-pdf-en-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#55` → **#56**
