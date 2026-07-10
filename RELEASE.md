# HandymanOS AI — Release 1.6.2

Portal invoices EN, dispatch map i18n, and jobs bulk on-hold on **1.6.1**.

## What's new in 1.6.2

- Customer portal **Invoices** heading testid and English pay E2E
- Dispatch job map fallback hint i18n (`mapsApiKeyHint`)
- Jobs bulk **on hold** status apply E2E
- `seedPortalCustomerInvoice()` reused in portal pay spec
- E2E: **132** tests total across 30 spec files

## Test coverage

- Unit: **83**
- E2E: **132** (30 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-66-portal-invoices-map-i18n-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#58` → **#59**
