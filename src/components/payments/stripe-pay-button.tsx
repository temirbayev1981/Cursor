import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { hasStripe } from '@/lib/env'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { useTranslation } from '@/contexts/locale-context'

interface StripePayButtonProps {
  amount: number
  invoiceNumber: string
  onSuccess?: () => void
}

export function StripePayButton({ amount, invoiceNumber, onSuccess }: StripePayButtonProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  const handlePay = async () => {
    setLoading(true)
    try {
      if (hasStripe) {
        // Production: redirect to Stripe Checkout session created by backend
        toast.info('Stripe Checkout', {
          description: `Сессия оплаты для ${invoiceNumber} (${formatCurrency(amount)}) — подключите backend webhook.`,
        })
      } else {
        await new Promise((r) => setTimeout(r, 1500))
        toast.success(t.invoices.paid ?? 'Оплачено', {
          description: `Демо-оплата ${formatCurrency(amount)} по счёту ${invoiceNumber}`,
        })
        onSuccess?.()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handlePay} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
      {hasStripe ? 'Stripe Pay' : t.common.pay}
    </Button>
  )
}
