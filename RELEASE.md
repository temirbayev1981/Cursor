# HandymanOS AI — Release 1.5.5

Portal decline, bulk schedule & assign, and CI smoke on **1.5.4**.

## What's new in 1.5.5

- Shared `PdfTableLabels` for estimate and invoice PDF exports
- Jobs bulk **Schedule & assign** — status + technician in one click
- Portal estimate approve/decline testids for stable E2E
- Optional Supabase smoke in deploy workflow (when secrets configured)
- E2E: portal decline estimate, bulk schedule (111 tests total)

## Test coverage

- Unit: **83**
- E2E: **111** (29 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-61-portal-decline-bulk-schedule-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#53` → **#54**
