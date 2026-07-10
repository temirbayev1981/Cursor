import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getStripeCheckoutEndpoint, hasStripe } from '@/lib/env'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { useTranslation } from '@/contexts/locale-context'
import { recordInvoicePayment } from '@/services/payment-service'
import { startStripeCheckout } from '@/services/stripe-service'
import type { Invoice } from '@/types'

interface StripePayButtonProps {
  invoice: Invoice
  customerEmail?: string
  portalToken?: string
  onSuccess?: () => void
}

export function StripePayButton({ invoice, customerEmail, portalToken, onSuccess }: StripePayButtonProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const amount = invoice.total - invoice.amount_paid

  const handlePay = async () => {
    if (amount <= 0) return
    setLoading(true)
    try {
      const result = await startStripeCheckout({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        amount,
        customerEmail,
        portalToken,
        successUrl: portalToken ? `${window.location.origin}/portal/customer?paid=${invoice.id}` : undefined,
        cancelUrl: portalToken ? `${window.location.origin}/portal/customer` : undefined,
      })

      if (result === 'redirected') return

      if (!hasStripe && !getStripeCheckoutEndpoint()) {
        await recordInvoicePayment(invoice, amount, 'cash', `manual_${Date.now()}`)
        toast.success(t.invoices.paid, {
          description: `${formatCurrency(amount)} — ${invoice.invoice_number}`,
        })
        onSuccess?.()
        return
      }

      toast.error(t.payments.stripeCheckoutUnavailable)
    } finally {
      setLoading(false)
    }
  }

  if (amount <= 0 || invoice.status === 'paid') return null

  return (
    <Button size="sm" variant="outline" onClick={handlePay} disabled={loading} data-testid={`invoice-pay-${invoice.id}`}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
      {hasStripe ? t.payments.payWithStripe : t.common.pay}
    </Button>
  )
}
