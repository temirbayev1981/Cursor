# HandymanOS AI — Release 1.5.3

Estimate PDF i18n and jobs bulk actions on **1.5.2**.

## What's new in 1.5.3

- Localized estimate PDF export (Russian and English labels)
- Jobs bulk status updates with checkbox selection and apply bar
- `useBulkUpdateJobStatus()` for batch job status changes
- E2E: estimate PDF i18n, jobs bulk schedule + select-all (105 tests total)

## Test coverage

- Unit: **83**
- E2E: **105** (28 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-59-estimate-i18n-jobs-bulk-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#51` → **#52**
