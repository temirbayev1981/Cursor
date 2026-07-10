# HandymanOS AI — Release 1.4.6

Onboarding, invite errors, and vendor PO export E2E on **1.4.5**.

## What's new in 1.4.6

- E2E: 6-step owner onboarding wizard + validation
- E2E: expired/unknown invite link errors on login
- E2E: vendor PO Excel export (85 tests total)
- Login shows alert for invalid/expired invites
- `data-testid` on onboarding wizard and vendor PO export

## Test coverage

- Unit: **83**
- E2E: **85** (23 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-54-onboarding-invite-vendor-e2e-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#46` → **#47**
