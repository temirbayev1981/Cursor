# HandymanOS AI — Release 1.5.2

Dispatch map, localized invoice PDF, and vendor PO batch on **1.5.1**.

## What's new in 1.5.2

- Localized invoice PDF export (Russian and English labels)
- Dispatch job map `data-testid` anchors for E2E
- E2E: dispatch map stop addresses, invoice PDF i18n, multi-PDF vendor PO batch (101 tests total)
- Second vendor PO fixture for batch upload tests

## Test coverage

- Unit: **83**
- E2E: **101** (27 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-58-dispatch-map-i18n-pdf-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#50` → **#51**
