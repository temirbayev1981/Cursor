# HandymanOS AI — Release 1.4.0

Release consolidating Phases 43–48 on **1.3.6**.

## What's new in 1.4.0

Consolidated E2E coverage across the full business workflow:

| Area | Coverage |
|------|----------|
| Work orders | Photo, email, PDF AI import; vendor PO upload & → job |
| Scheduling | Week view + schedule draft job |
| Billing | Estimates smart engine, send, convert; invoice payment |
| CRM | Customers create/search/portal; jobs create/search/draft |
| Inventory | Low-stock alert, receive stock, create material |

**56 E2E tests** across 17 spec files · **83 unit tests**

## Test coverage

- Unit: **83**
- E2E: **56** (17 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-48-release-1-4-0-materials-e2e-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#40` → **#41**
