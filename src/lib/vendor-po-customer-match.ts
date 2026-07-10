import type { Customer } from '@/types'
import type { VendorPORecord } from '@/types/vendor-po'

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function phoneDigits(value: string): string {
  return value.replace(/\D/g, '').slice(-10)
}

function nameScore(a: string, b: string): number {
  const na = normalizeText(a)
  const nb = normalizeText(b)
  if (!na || !nb) return 0
  if (na === nb) return 100
  if (na.includes(nb) || nb.includes(na)) return 80
  const wordsA = a.toLowerCase().split(/\s+/).filter(Boolean)
  const wordsB = b.toLowerCase().split(/\s+/).filter(Boolean)
  const overlap = wordsA.filter((w) => wordsB.some((x) => x.includes(w) || w.includes(x))).length
  return overlap > 0 ? overlap * 20 : 0
}

export function matchCustomerFromVendorPO(
  po: Pick<VendorPORecord, 'client_company' | 'client_email' | 'client_phone' | 'client_address' | 'service_address'>,
  customers: Customer[]
): Customer | null {
  if (customers.length === 0) return null

  if (po.client_email) {
    const email = po.client_email.toLowerCase().trim()
    const byEmail = customers.find((c) => c.email?.toLowerCase() === email)
    if (byEmail) return byEmail
  }

  if (po.client_phone) {
    const poPhone = phoneDigits(po.client_phone)
    if (poPhone.length >= 7) {
      const byPhone = customers.find((c) => {
        const digits = phoneDigits(c.phone ?? '')
        return digits && (digits === poPhone || digits.endsWith(poPhone) || poPhone.endsWith(digits))
      })
      if (byPhone) return byPhone
    }
  }

  if (po.client_company) {
    let best: Customer | null = null
    let bestScore = 0
    for (const customer of customers) {
      const score = nameScore(po.client_company, customer.name)
      if (score > bestScore) {
        bestScore = score
        best = customer
      }
    }
    if (best && bestScore >= 40) return best
  }

  const addressHint = po.service_address || po.client_address
  if (addressHint) {
    const hint = normalizeText(addressHint)
    const byAddress = customers.find((c) => {
      const addr = normalizeText(c.address ?? '')
      return addr && (addr.includes(hint.slice(0, 8)) || hint.includes(addr.slice(0, 8)))
    })
    if (byAddress) return byAddress
  }

  const propertyMgmt = customers.find((c) => c.type === 'property_management')
  if (propertyMgmt) return propertyMgmt

  return customers[0] ?? null
}
