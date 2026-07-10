# HandymanOS AI — Release 1.4.2

Properties & inventory E2E on **1.4.1**.

## What's new in 1.4.2

- E2E: properties list + create property
- E2E: job material usage deducts inventory (64 tests total)
- `verify:production` includes Supabase smoke workflow check

## Test coverage

- Unit: **83**
- E2E: **64** (19 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-50-properties-inventory-e2e-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#42` → **#43**
