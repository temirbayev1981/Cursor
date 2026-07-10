# HandymanOS AI — Release 1.4.7

Vendor PO, search, AI follow-up, and invoice send E2E on **1.4.6**.

## What's new in 1.4.7

- E2E: vendor PO multi-site badge + emergency priority rows
- E2E: AI assistant multi-turn conversation
- E2E: global header search → jobs navigation
- E2E: draft invoice send (90 tests total)
- `seedDraftInvoice` helper; search and vendor PO testids

## Test coverage

- Unit: **83**
- E2E: **90** (24 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-55-vendor-search-ai-invoice-e2e-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#47` → **#48**
