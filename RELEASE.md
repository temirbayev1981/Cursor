# HandymanOS AI — Release 1.4.3

Technicians, theme toggle, and reports export E2E on **1.4.2**.

## What's new in 1.4.3

- E2E: technicians team cards + create technician
- E2E: settings and command palette theme toggle
- E2E: reports technicians tab + CSV export (70 tests total)
- `data-testid` on employee form, theme toggle, report export buttons

## Test coverage

- Unit: **83**
- E2E: **70** (20 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-51-technicians-theme-reports-e2e-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#43` → **#44**
