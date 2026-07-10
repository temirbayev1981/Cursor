# HandymanOS AI — Release 1.3.1

Field ops completion on **1.3.0**.

## What's new in 1.3.1

- E2E: offline photo upload sync (all 5 offline action types now have E2E)
- Unit tests: `storage-service` demo photo upload
- Platform audit: observability integration check + recommendation
- Settings → Integrations: i18n labels, separate Email and SMS cards
- E2E: integrations tab shows configure state in demo mode

## Test coverage

- Unit: **82**
- E2E: **36** (11 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-42-offline-photo-audit-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#34` → **#35**
