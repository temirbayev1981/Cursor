import { useEffect, useMemo, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useCompanyQueryScope } from '@/hooks/use-company-scope'
import { listFuelLogsPage } from '@/services/entity-service'
import { DEFAULT_PAGE_SIZE, type PageSizeOption, type TablePaginationResult } from '@/hooks/use-table-pagination'
import type { FuelLog } from '@/types'

export interface ServerFuelLogsTableOptions {
  pageSize?: PageSizeOption
}

export function useServerFuelLogsTable(options: ServerFuelLogsTableOptions = {}) {
  const { companyId, enabled, queryKey } = useCompanyQueryScope()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(options.pageSize ?? DEFAULT_PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [pageSize])

  const query = useQuery({
    queryKey: ['fuelLogs', queryKey, 'page', page, pageSize],
    queryFn: () => listFuelLogsPage(companyId, { page, pageSize }),
    enabled: enabled && Boolean(companyId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const pagination = useMemo((): TablePaginationResult<FuelLog> => {
    const totalItems = query.data?.total ?? 0
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const safePage = Math.min(page, totalPages)
    const startIndex = (safePage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)
    const items = query.data?.items ?? []

    return {
      page: safePage,
      setPage,
      pageSize,
      setPageSize,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      paginatedItems: items,
    }
  }, [query.data, page, pageSize])

  return {
    items: query.data?.items ?? [],
    isLoading: query.isLoading,
    pagination,
    refetch: query.refetch,
  }
}
