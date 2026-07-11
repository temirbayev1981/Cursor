import { useAuth } from '@/contexts/auth-context'

/** Throws when company context is required but not yet available. */
export function requireCompanyId(companyId: string | undefined | null): string {
  if (!companyId) {
    throw new Error('Company context is not available')
  }
  return companyId
}

/** React Query scope — queries stay disabled until company is loaded. */
export function useCompanyQueryScope() {
  const { company, isLoading } = useAuth()
  const companyId = company?.id ?? ''
  return {
    companyId,
    enabled: !isLoading && Boolean(company?.id),
    queryKey: company?.id ?? 'pending',
  }
}

/** Active company id from auth (undefined while loading or if missing). */
export function useAuthCompanyId(): string | undefined {
  const { company } = useAuth()
  return company?.id
}

/** Mutation scope — returns company id or null (caller must guard in mutationFn). */
export function useMutationCompanyScope() {
  const { company, isLoading } = useAuth()
  return {
    companyId: company?.id ?? null,
    queryKey: company?.id ?? 'pending',
    ready: !isLoading && Boolean(company?.id),
  }
}
