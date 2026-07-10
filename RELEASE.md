# HandymanOS AI — Release 1.3.5

Estimates & invoices E2E on **1.3.4**.

## What's new in 1.3.5

- E2E: estimates smart engine, create, send, convert to invoice
- E2E: invoices demo payment (48 tests total)
- `data-testid` on billing workflow actions

## Test coverage

- Unit: **83**
- E2E: **48** (15 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-46-estimates-invoices-e2e-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#38` → **#39**
