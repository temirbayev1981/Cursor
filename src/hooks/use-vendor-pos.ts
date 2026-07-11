import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import {
  getVendorPOs,
  saveVendorPOBatch,
  deleteVendorPO,
  seedVendorPOs,
} from '@/services/vendor-po-service'
import { SEED_VENDOR_POS } from '@/data/seed-vendor-pos'
import type { VendorPOInput } from '@/types/vendor-po'

const QUERY_KEY = 'vendor-pos'

export function useVendorPOs() {
  const { company } = useAuth()
  const companyId = company?.id ?? 'comp-001'

  return useQuery({
    queryKey: [QUERY_KEY, companyId],
    queryFn: () => getVendorPOs(companyId),
    staleTime: 30_000,
  })
}

export function useSaveVendorPOs() {
  const queryClient = useQueryClient()
  const { company } = useAuth()
  const companyId = company?.id ?? 'comp-001'

  return useMutation({
    mutationFn: (inputs: VendorPOInput[]) =>
      saveVendorPOBatch(inputs.map((input) => ({ ...input, company_id: companyId }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, companyId] })
    },
  })
}

export function useDeleteVendorPO() {
  const queryClient = useQueryClient()
  const { company } = useAuth()
  const companyId = company?.id ?? 'comp-001'

  return useMutation({
    mutationFn: (id: string) => deleteVendorPO(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, companyId] })
    },
  })
}

export function useSeedVendorPOs() {
  const queryClient = useQueryClient()
  const { company } = useAuth()
  const companyId = company?.id ?? 'comp-001'

  return useMutation({
    mutationFn: async () => {
      const records = SEED_VENDOR_POS.map((r) => ({ ...r, company_id: companyId }))
      await seedVendorPOs(records)
      return records
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, companyId] })
    },
  })
}
