import { useEffect, useMemo, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useCompanyQueryScope } from '@/hooks/use-company-scope'
import { listEntitiesPage } from '@/services/entity-service'
import { DEFAULT_PAGE_SIZE, type PageSizeOption, type TablePaginationResult } from '@/hooks/use-table-pagination'
import type { Customer, Job, Invoice } from '@/types'

type PageableEntityMap = {
  customers: Customer
  jobs: Job
  invoices: Invoice
}

export interface ServerEntityTableOptions {
  search?: string
  status?: string
  pageSize?: PageSizeOption
}

export function useServerEntityTable<K extends keyof PageableEntityMap>(
  entity: K,
  options: ServerEntityTableOptions = {},
) {
  const { companyId, enabled, queryKey } = useCompanyQueryScope()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(options.pageSize ?? DEFAULT_PAGE_SIZE)
  const search = options.search ?? ''
  const status = options.status ?? 'all'

  const resetSignature = JSON.stringify([search, status, pageSize])
  useEffect(() => {
    setPage(1)
  }, [resetSignature])

  const query = useQuery({
    queryKey: [entity, queryKey, 'page', page, pageSize, search, status],
    queryFn: () => listEntitiesPage(entity, companyId, { page, pageSize, search, status }),
    enabled: enabled && Boolean(companyId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const pagination = useMemo((): TablePaginationResult<PageableEntityMap[K]> => {
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
