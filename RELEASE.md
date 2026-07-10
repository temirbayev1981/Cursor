# HandymanOS AI — Release 1.6.1

Report expenses PDF i18n and jobs bulk delete on **1.6.0**.

## What's new in 1.6.1

- Report PDF **expenses** tab export with localized category labels
- `reports-tab-expenses` testid for E2E
- Jobs **bulk delete** action with `jobs-bulk-delete` button
- `useBulkDeleteJobs()` hook via `deleteEntity`
- E2E: expenses PDF i18n (RU/EN), bulk delete draft jobs
- E2E: **130** tests total across 30 spec files

## Test coverage

- Unit: **83**
- E2E: **130** (30 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-65-expenses-pdf-bulk-delete-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#57` → **#58**
