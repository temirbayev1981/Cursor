# HandymanOS AI — Release 1.3.2

Work orders AI E2E on **1.3.1**.

## What's new in 1.3.2

- E2E: work orders photo upload → AI extraction panel (38 tests total)
- E2E: work orders email import → AI analysis complete
- README `/dispatch` route; `.env.example` build/E2E notes

## Test coverage

- Unit: **82**
- E2E: **38** (12 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-43-work-orders-e2e-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#35` → **#36**
