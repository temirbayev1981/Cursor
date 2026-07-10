# HandymanOS AI — Release 1.4.4

Dispatch, AI chat, and PDF export E2E on **1.4.3**.

## What's new in 1.4.4

- E2E: dispatch kanban drag-and-drop + route optimizer panel
- E2E: AI assistant custom chat input and suggested questions
- E2E: reports PDF export preview popup (75 tests total)
- `data-testid` on dispatch columns, route panel, AI chat controls
- Dispatch kanban: `useDroppable` columns for cross-column drag-and-drop

## Test coverage

- Unit: **83**
- E2E: **75** (21 spec files)

## Deploy

```bash
npm run verify:production
npm run test:e2e

git checkout main
git merge cursor/phase-52-dispatch-ai-pdf-e2e-1b4a
git push origin main
```

## Merge chain

`#24` → … → `#44` → **#45**
