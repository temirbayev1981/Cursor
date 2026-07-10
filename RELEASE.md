# HandymanOS AI — Release 1.3.6

Jobs & customers E2E on **1.3.5**.

## What's new in 1.3.6

- E2E: customers create, search, portal link copy
- E2E: jobs create, search, draft filter (53 tests total)
- `data-testid` on CRM forms and search inputs

## Test coverage

- Unit: **83**
- E2E: **53** (16 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-47-jobs-customers-e2e-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#39` → **#40**
