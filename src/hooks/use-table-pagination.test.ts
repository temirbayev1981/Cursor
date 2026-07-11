import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTablePagination } from './use-table-pagination'

describe('useTablePagination', () => {
  const items = Array.from({ length: 30 }, (_, i) => `item-${i + 1}`)

  it('returns first page slice with default page size', () => {
    const { result } = renderHook(() => useTablePagination(items))
    expect(result.current.paginatedItems).toHaveLength(25)
    expect(result.current.paginatedItems[0]).toBe('item-1')
    expect(result.current.paginatedItems[24]).toBe('item-25')
    expect(result.current.totalPages).toBe(2)
  })

  it('advances to next page', () => {
    const { result } = renderHook(() => useTablePagination(items, { pageSize: 10 }))
    act(() => result.current.setPage(2))
    expect(result.current.paginatedItems).toHaveLength(10)
    expect(result.current.paginatedItems[0]).toBe('item-11')
    expect(result.current.startIndex).toBe(10)
    expect(result.current.endIndex).toBe(20)
  })

  it('resets to page 1 when items shrink', () => {
    const { result, rerender } = renderHook(
      ({ list }) => useTablePagination(list, { pageSize: 10 }),
      { initialProps: { list: items } },
    )
    act(() => result.current.setPage(3))
    rerender({ list: items.slice(0, 15) })
    expect(result.current.page).toBe(1)
    expect(result.current.totalPages).toBe(2)
  })
})
