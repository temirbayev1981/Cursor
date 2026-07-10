import { useMemo } from 'react'
import type { Customer } from '@/types'
import { loadStore, STORE_KEYS } from '@/lib/data-store'
import { getPortalSession, isDemoPortalAccess } from '@/services/portal-service'

const DEMO_CUSTOMER_IDS = {
  customer: 'cust-002',
  property: 'cust-001',
} as const

export function usePortalContext(portalType: 'customer' | 'property') {
  const session = getPortalSession()

  return useMemo(() => {
    const customers = loadStore<Customer>(STORE_KEYS.customers)

    if (session && session.portalType === portalType) {
      const customer = customers.find((c) => c.id === session.customerId)
      return {
        customerId: session.customerId,
        companyId: session.companyId,
        customerName: customer?.name ?? session.customerName ?? 'Customer',
        isMagicLink: true,
      }
    }

    if (isDemoPortalAccess()) {
      const customerId = DEMO_CUSTOMER_IDS[portalType]
      const customer = customers.find((c) => c.id === customerId)
      return {
        customerId,
        companyId: customer?.company_id ?? 'comp-001',
        customerName: customer?.name ?? (portalType === 'customer' ? 'Sarah Johnson' : 'ABC Property Management'),
        isMagicLink: false,
      }
    }

    return null
  }, [session, portalType])
}
