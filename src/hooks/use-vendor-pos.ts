import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCompanyQueryScope, useMutationCompanyScope, requireCompanyId } from '@/hooks/use-company-scope'
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
  const { companyId, enabled, queryKey } = useCompanyQueryScope()

  return useQuery({
    queryKey: [QUERY_KEY, queryKey],
    queryFn: () => getVendorPOs(requireCompanyId(companyId)),
    enabled,
    staleTime: 30_000,
  })
}

export function useSaveVendorPOs() {
  const queryClient = useQueryClient()
  const { companyId, queryKey } = useMutationCompanyScope()

  return useMutation({
    mutationFn: (inputs: VendorPOInput[]) => {
      const cid = requireCompanyId(companyId)
      return saveVendorPOBatch(inputs.map((input) => ({ ...input, company_id: cid })))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, queryKey] })
    },
  })
}

export function useDeleteVendorPO() {
  const queryClient = useQueryClient()
  const { companyId, queryKey } = useMutationCompanyScope()

  return useMutation({
    mutationFn: (id: string) => {
      requireCompanyId(companyId)
      return deleteVendorPO(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, queryKey] })
    },
  })
}

export function useSeedVendorPOs() {
  const queryClient = useQueryClient()
  const { companyId, queryKey } = useMutationCompanyScope()

  return useMutation({
    mutationFn: async () => {
      const cid = requireCompanyId(companyId)
      const records = SEED_VENDOR_POS.map((r) => ({ ...r, company_id: cid }))
      await seedVendorPOs(records)
      return records
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, queryKey] })
    },
  })
}
