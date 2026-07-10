import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EstimateStatusBadge } from '@/components/shared/status-badge'
import { StripePayButton } from '@/components/payments/stripe-pay-button'
import { TableSkeleton } from '@/components/shared/skeleton'
import { useEstimates, useInvoices } from '@/hooks/use-entities'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'

export default function CustomerPortalPage() {
  const { t, locale } = useTranslation()
  const dateLocale = locale === 'ru' ? 'ru-RU' : 'en-US'
  const { data: estimates = [], isLoading: estLoading } = useEstimates()
  const { data: invoices = [], isLoading: invLoading } = useInvoices()
  const myEstimates = estimates.filter((e) => e.customer_id === 'cust-002')
  const myInvoices = invoices.filter((i) => i.customer_id === 'cust-002' || i.customer_id === 'cust-001')

  if (estLoading || invLoading) return <div className="p-6"><TableSkeleton /></div>

  return (
    <div className="gradient-bg min-h-screen">
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">{t.customerPortal.title}</h1>
          <p className="text-muted-foreground">Sarah Johnson</p>
        </div>

        <h2 className="text-lg font-semibold mb-4">{t.customerPortal.yourEstimates}</h2>
        <div className="space-y-3 mb-8">
          {myEstimates.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">{t.customerPortal.noEstimates}</CardContent></Card>
          ) : (
            myEstimates.map((est) => (
              <Card key={est.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{est.title}</p>
                    <EstimateStatusBadge status={est.status} />
                  </div>
                  <p className="text-2xl font-bold mb-2">{formatCurrency(est.total)}</p>
                  <p className="text-sm text-muted-foreground mb-3">{t.common.validUntil} {formatDate(est.valid_until, dateLocale)}</p>
                  {est.status === 'sent' && (
                    <div className="flex gap-2">
                      <Button className="flex-1">{t.customerPortal.approveSign}</Button>
                      <Button variant="outline">{t.common.decline}</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <h2 className="text-lg font-semibold mb-4">{t.customerPortal.invoices}</h2>
        <div className="space-y-3 mb-8">
          {myInvoices.slice(0, 2).map((inv) => (
            <Card key={inv.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{inv.invoice_number}</p>
                  <p className="text-lg font-bold">{formatCurrency(inv.total)}</p>
                </div>
                <StripePayButton amount={inv.total - inv.amount_paid} invoiceNumber={inv.invoice_number} />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6 text-center">
            <Star className="h-8 w-8 text-accent mx-auto mb-3" />
            <p className="font-medium mb-2">{t.customerPortal.reviewPrompt}</p>
            <Button variant="outline">{t.customerPortal.leaveReview}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
