# HandymanOS AI — Release 1.5.4

Report PDF i18n, bulk technician assign, and portal pay on **1.5.3**.

## What's new in 1.5.4

- Localized report PDF export (Russian and English labels)
- Jobs bulk technician assignment bar with `useBulkAssignTechnician()`
- E2E: report PDF i18n, bulk assign, customer portal demo pay (109 tests total)

## Test coverage

- Unit: **83**
- E2E: **109** (29 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-60-report-i18n-portal-bulk-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#52` → **#53**
