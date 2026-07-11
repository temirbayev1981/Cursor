import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslation } from '@/contexts/locale-context'
import { PAGE_SIZE_OPTIONS, type TablePaginationResult } from '@/hooks/use-table-pagination'

interface TablePaginationProps<T> {
  pagination: TablePaginationResult<T>
  testId?: string
}

export function TablePagination<T>({ pagination, testId = 'table-pagination' }: TablePaginationProps<T>) {
  const { t } = useTranslation()
  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
  } = pagination

  if (totalItems === 0) return null

  const from = startIndex + 1
  const to = endIndex

  return (
    <div
      className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      data-testid={testId}
    >
      <p className="text-sm text-muted-foreground" data-testid={`${testId}-summary`}>
        {t.common.paginationShowing
          .replace('{from}', String(from))
          .replace('{to}', String(to))
          .replace('{total}', String(totalItems))}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{t.common.rowsPerPage}</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => setPageSize(Number(value) as typeof pageSize)}
          >
            <SelectTrigger className="h-8 w-[72px]" data-testid={`${testId}-page-size`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground" data-testid={`${testId}-page-indicator`}>
          {t.common.pageOf.replace('{page}', String(page)).replace('{total}', String(totalPages))}
        </p>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            data-testid={`${testId}-prev`}
            onClick={() => setPage(page - 1)}
          >
            {t.common.previous}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            data-testid={`${testId}-next`}
            onClick={() => setPage(page + 1)}
          >
            {t.common.next}
          </Button>
        </div>
      </div>
    </div>
  )
}
