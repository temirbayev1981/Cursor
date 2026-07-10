import { vi } from 'vitest'

vi.mock('@/lib/supabase', async () => {
  const { createE2eMockSupabase } = await import('@/lib/e2e-mock-supabase')
  return {
    isBackendConfigured: true,
    supabase: createE2eMockSupabase(),
    getSupabaseAuthHeaders: async () => ({
      'Content-Type': 'application/json',
      Authorization: 'Bearer vitest-token',
    }),
  }
})
