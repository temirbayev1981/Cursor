# HandymanOS AI — Release 1.2.8

Error boundary and portal error coverage on **1.2.7**.

## What's new in 1.2.8

- E2E: error boundary localized UI + error report capture (33 tests total)
- E2E: portal `/portal/access` invalid and expired token paths
- Unit tests: `observability` error report storage
- Deploy workflow runs `verify:production` (parity with CI)
- `verify:production` gates all E2E spec files automatically
- Docs: version and test counts updated

## Prior releases (1.2.7)

- Complete technician offline E2E (clock-out, complete job)
- All five offline action types unit-tested

## Release checklist

```bash
npm run verify:production
npm run verify:release
npm run test:e2e

git checkout main
git merge cursor/phase-40-error-portal-ci-1b4a
git push origin main
```

## Merge chain (open PRs)

`#24` → … → `#32` → **#33**
