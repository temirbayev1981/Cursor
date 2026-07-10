# HandymanOS AI — Release 1.4.1

Fleet & operations E2E on **1.4.0**.

## What's new in 1.4.1

- E2E: vehicles fleet, fuel logs, create vehicle
- E2E: expenses create + monthly total
- E2E: command palette (Ctrl+K) navigation and search (61 tests total)

## Test coverage

- Unit: **83**
- E2E: **61** (18 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-49-fleet-expenses-command-palette-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#41` → **#42**
