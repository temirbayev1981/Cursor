# Merging the 1.7.x release stack

HandymanOS AI **1.7.4** is delivered as a chain of stacked pull requests. Merge them **in order** into `main` so each PR builds on the previous one.

## PR order

| Order | PR | Branch | Version | Summary |
|------:|-----|--------|---------|---------|
| 1 | [#63](https://github.com/temirbayev1981/Cursor/pull/63) | `cursor/remove-demo-production-only-1b4a` | 1.7.0 | Production-only Supabase, demo mode removed |
| 2 | [#64](https://github.com/temirbayev1981/Cursor/pull/64) | `cursor/audit-p2-fixes-1b4a` | 1.7.1 | Portal RPC-only, audit i18n, metrics |
| 3 | [#65](https://github.com/temirbayev1981/Cursor/pull/65) | `cursor/audit-p3-logaudit-e2e-1b4a` | 1.7.2 | logAudit expansion, portal hooks RPC-only |
| 4 | [#66](https://github.com/temirbayev1981/Cursor/pull/66) | `cursor/e2e-fixes-audit-p4-1b4a` | 1.7.3 | E2E 138/138, mock upsert, portal pay |
| 5 | [#67](https://github.com/temirbayev1981/Cursor/pull/67) | `cursor/release-audit-p4-1b4a` | 1.7.4 | Localized audit log, release sync |
| 6 | [#68](https://github.com/temirbayev1981/Cursor/pull/68) | `cursor/release-docs-consolidation-1b4a` | 1.7.4 | Docs, smoke RPC checks, MERGE.md |

> If PR numbers differ in your fork, follow the branch order and version column.

## Quick merge (GitHub UI)

1. Merge **#63** → `main` (squash or merge commit per your policy).
2. Rebase or merge `main` into **#64**, then merge **#64**.
3. Repeat for **#65**, **#66**, **#67**, **#68**.

Alternatively, merge only the **latest** branch (`cursor/release-docs-consolidation-1b4a`) if it already contains the full stack and GitHub shows a clean diff against `main`.

## CLI merge (example)

```bash
git checkout main
git pull origin main

# Option A: merge each branch in order
for branch in \
  cursor/remove-demo-production-only-1b4a \
  cursor/audit-p2-fixes-1b4a \
  cursor/audit-p3-logaudit-e2e-1b4a \
  cursor/e2e-fixes-audit-p4-1b4a \
  cursor/release-audit-p4-1b4a \
  cursor/release-docs-consolidation-1b4a
do
  git merge origin/"$branch" -m "Merge $branch into main"
done

git push origin main
```

## After merge

```bash
npm ci
npm run verify:production
npm run test:e2e

# With live Supabase credentials:
npm run smoke:supabase
```

Configure GitHub Actions secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optional Stripe/maps/OpenAI). Push to `main` triggers the **Deploy** workflow and GitHub Pages build with `VITE_APP_VERSION` from `package.json` / `deploy.yml`.

## Rollback

Tag `main` before merging:

```bash
git tag pre-1.7.4
git push origin pre-1.7.4
```

To roll back, reset `main` to the tag and force-push (only if your team policy allows).
