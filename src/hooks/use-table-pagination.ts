import { useEffect, useMemo, useState } from 'react'

export const DEFAULT_PAGE_SIZE = 25
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number]

export interface TablePaginationResult<T> {
  page: number
  setPage: (page: number) => void
  pageSize: PageSizeOption
  setPageSize: (size: PageSizeOption) => void
  totalItems: number
  totalPages: number
  startIndex: number
  endIndex: number
  paginatedItems: T[]
}

export function useTablePagination<T>(
  items: T[],
  options?: { pageSize?: PageSizeOption; resetDeps?: readonly unknown[] },
): TablePaginationResult<T> {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(options?.pageSize ?? DEFAULT_PAGE_SIZE)

  const resetSignature = JSON.stringify(options?.resetDeps ?? [])
  useEffect(() => {
    setPage(1)
  }, [items.length, pageSize, resetSignature])

  return useMemo(() => {
    const totalItems = items.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const safePage = Math.min(page, totalPages)
    const startIndex = (safePage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)
    const paginatedItems = items.slice(startIndex, endIndex)

    return {
      page: safePage,
      setPage,
      pageSize,
      setPageSize,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      paginatedItems,
    }
  }, [items, page, pageSize])
}
