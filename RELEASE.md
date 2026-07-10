# HandymanOS AI — Release 1.6.4

Audit P1 fixes on **1.6.3**.

## What's new in 1.6.4

- i18n toasts: estimate sent, invoice sent, Stripe checkout errors
- Expense category labels localized in form datalist, dashboard pie chart, reports chart/PDF
- `localizeExpenseChart()` centralized in `analytics.ts`
- Removed deprecated `exportReportPdfPlaceholder`
- Jobs bulk delete: two-click confirm (`bulkDeleteConfirm`)
- Unit tests: `export.test.ts`, `localizeExpenseChart` in `analytics.test.ts`
- E2E: bulk delete two-click, portal access EN errors, scheduling EN labels
- E2E: **137** tests total across 30 spec files

## Test coverage

- Unit: **87**
- E2E: **137** (30 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/audit-fixes-p1-i18n-bulk-1b4a
git push origin main
```

## Merge chain

`#50` → … → `#61` → `#62` (this release)
