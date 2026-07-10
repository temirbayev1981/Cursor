# HandymanOS AI — Release 1.3.4

Workflow E2E on **1.3.3**.

## What's new in 1.3.4

- E2E: vendor PO → create job workflow (43 tests total)
- E2E: work orders PDF tab AI analyze
- E2E: scheduling form → calendar event

## Test coverage

- Unit: **83**
- E2E: **43** (14 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-45-workflows-e2e-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#37` → **#38**
