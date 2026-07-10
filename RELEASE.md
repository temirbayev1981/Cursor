# HandymanOS AI — Release 1.5.1

Invoice PDF export on **1.5.0**.

## What's new in 1.5.1

- `exportInvoicePdf()` — print-ready invoice preview with balance
- PDF export button on each invoice row
- E2E: invoice PDF, outstanding stats, vendor PO batch UI (96 tests total)
- `data-testid` on invoice export, outstanding total, vendor PO count

## Test coverage

- Unit: **83**
- E2E: **96** (26 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-57-invoice-pdf-e2e-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#49` → **#50**
