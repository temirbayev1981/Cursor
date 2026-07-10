import { describe, expect, it } from 'vitest'
import type { TableInsert, TableName } from '@/lib/supabase-queries'

describe('supabase-queries types', () => {
  it('accepts valid insert shapes for core tables', () => {
    const company: TableInsert<'companies'> = {
      id: 'c1',
      name: 'Test Co',
      email: 'test@example.com',
    }
    const profile: TableInsert<'profiles'> = {
      id: 'u1',
      company_id: 'c1',
      email: 'test@example.com',
      role: 'owner',
    }
    const audit: TableInsert<'audit_logs'> = {
      company_id: 'c1',
      user_id: 'u1',
      action: 'create',
      entity_type: 'job',
      entity_id: 'j1',
    }

    const tables: TableName[] = ['companies', 'profiles', 'audit_logs']
    expect(company.name).toBe('Test Co')
    expect(profile.role).toBe('owner')
    expect(audit.action).toBe('create')
    expect(tables).toHaveLength(3)
  })
})
