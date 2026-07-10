import { useMemo } from 'react'
import type { Customer } from '@/types'
import type { PortalContext } from '@/types/portal'
import { loadStore, STORE_KEYS } from '@/lib/data-store'
import { getPortalSession } from '@/services/portal-service'

export function usePortalContext(portalType: 'customer' | 'property'): PortalContext | null {
  const session = getPortalSession()

  return useMemo(() => {
    if (!session || session.portalType !== portalType) return null

    const customers = loadStore<Customer>(STORE_KEYS.customers)
    const customer = customers.find((c) => c.id === session.customerId)

    return {
      customerId: session.customerId,
      companyId: session.companyId,
      customerName: customer?.name ?? session.customerName ?? 'Customer',
      isMagicLink: true,
    }
  }, [session, portalType])
}
