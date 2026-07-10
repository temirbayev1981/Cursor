# HandymanOS AI — Release 1.6.3

Portal review EN and route optimizer i18n E2E on **1.6.2**.

## What's new in 1.6.3

- Customer portal review testids: `customer-portal-leave-review`, `portal-review-submit`
- Route optimizer `route-optimizer-open-maps` testid
- `clearPortalReview()` E2E helper
- E2E: portal review EN, route optimizer EN labels on dispatch
- E2E: **134** tests total across 30 spec files

## Test coverage

- Unit: **83**
- E2E: **134** (30 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-67-portal-review-route-i18n-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#59` → **#60**
