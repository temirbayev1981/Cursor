# HandymanOS AI — Release 1.3.3

Vendor PO PDF E2E on **1.3.2**.

## What's new in 1.3.3

- E2E: vendor PO PDF upload → parse → table row (39 tests total)
- `data-testid` on vendor PO dropzone; sample PDF fixture

## Test coverage

- Unit: **82**
- E2E: **39** (13 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-44-vendor-po-pdf-e2e-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#36` → **#37**
