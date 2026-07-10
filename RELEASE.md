# HandymanOS AI — Release 1.5.6

Property portal EN, report tech PDF tab, and bulk cancel on **1.5.5**.

## What's new in 1.5.6

- Jobs bulk **Cancel** for selected draft jobs
- Property portal English locale E2E + form testids
- Report PDF technicians tab i18n (RU/EN)
- E2E: property portal EN, technicians PDF, bulk cancel (115 tests total)

## Test coverage

- Unit: **83**
- E2E: **115** (30 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-62-portal-en-bulk-cancel-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#54` → **#55**
