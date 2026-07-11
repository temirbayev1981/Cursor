/** Max rows fetched per entity list from Supabase (newest first). */
export const ENTITY_LIST_LIMIT = 500

/** Default page size for server-side table pagination. */
export const ENTITY_PAGE_SIZE_DEFAULT = 25

/** Max page size for server-side queries. */
export const ENTITY_PAGE_SIZE_MAX = 100

export interface EntityListPageParams {
  page: number
  pageSize: number
  search?: string
  status?: string
}

export interface EntityListPageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
