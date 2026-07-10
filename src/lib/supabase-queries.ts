import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

/** Entity access goes through typed table helpers in this module. */
export const TYPED_SUPABASE_QUERIES = true as const

type PublicSchema = Database['public']
type Tables = PublicSchema['Tables']
type DbClient = SupabaseClient<Database>

export type TableName = keyof Tables
export type TableRow<T extends TableName> = Tables[T]['Row']
export type TableInsert<T extends TableName> = Tables[T]['Insert']
export type TableUpdate<T extends TableName> = Tables[T]['Update']

type UpsertOptions = { onConflict?: string }

export function requireSupabase(): DbClient {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase
}

/** Generic table helpers — supabase-js loses row inference; casts isolated here. */
function fromTable<T extends TableName>(table: T) {
  return requireSupabase().from(table) as ReturnType<DbClient['from']>
}

export function insertRows<T extends TableName>(
  table: T,
  rows: TableInsert<T> | TableInsert<T>[],
) {
  return fromTable(table).insert(rows as never)
}

export function upsertRows<T extends TableName>(
  table: T,
  rows: TableInsert<T> | TableInsert<T>[],
  options?: UpsertOptions,
) {
  const query = fromTable(table)
  if (options?.onConflict) {
    return query.upsert(rows as never, { onConflict: options.onConflict })
  }
  return query.upsert(rows as never)
}

export function updateRows<T extends TableName>(
  table: T,
  values: TableUpdate<T>,
  column: keyof TableRow<T> & string,
  value: string | number | boolean,
) {
  return fromTable(table).update(values as never).eq(column, value)
}
