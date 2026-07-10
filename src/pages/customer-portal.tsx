import { useEffect, useState } from 'react'
import { LogOut, Star } from 'lucide-react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { EstimateStatusBadge } from '@/components/shared/status-badge'
import { StripePayButton } from '@/components/payments/stripe-pay-button'
import { TableSkeleton } from '@/components/shared/skeleton'
import { PortalReviewForm } from '@/components/portal/portal-review-form'
import { usePortalContext } from '@/hooks/use-portal-context'
import {
  usePortalEstimates,
  usePortalInvoices,
  usePortalEstimateAction,
  usePortalReviewSubmit,
} from '@/hooks/use-portal-data'
import { clearPortalSession, getPortalToken } from '@/services/portal-service'
import { hasPortalReview } from '@/services/portal-data-service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'
import { useDateLocale } from '@/hooks/use-date-locale'
import {
  getCustomerNotificationPreferences,
  saveCustomerNotificationPreferences,
  type CustomerNotificationPreferences,
} from '@/lib/customer-notification-prefs'
import { toast } from 'sonner'
import type { Estimate } from '@/types'

export default function CustomerPortalPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const portal = usePortalContext('customer')
  const dateLocale = useDateLocale()
  const { data: myEstimates = [], isLoading: estLoading } = usePortalEstimates('customer')
  const { data: myInvoices = [], isLoading: invLoading } = usePortalInvoices('customer')
  const estimateAction = usePortalEstimateAction()
  const reviewSubmit = usePortalReviewSubmit()
  const [reviewed, setReviewed] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [notifyPrefs, setNotifyPrefs] = useState<CustomerNotificationPreferences>({ email: true, sms: false })

  useEffect(() => {
    if (!portal) return
    setReviewed(hasPortalReview(portal.customerId))
    setNotifyPrefs(getCustomerNotificationPreferences(portal.customerId))
  }, [portal])

  useEffect(() => {
    const paid = searchParams.get('paid')
    if (!paid) return
    toast.success(t.customerPortal.paymentSuccess)
    searchParams.delete('paid')
    setSearchParams(searchParams, { replace: true })
  }, [searchParams, setSearchParams, t.customerPortal.paymentSuccess])

  if (!portal) return <Navigate to="/login?portal=1" replace />

  const updateEstimateStatus = (est: Estimate, status: Estimate['status']) => {
    estimateAction.mutate(
      { estimate: est, status },
      {
        onSuccess: () => {
          toast.success(status === 'approved' ? t.customerPortal.estimateApproved : t.customerPortal.estimateDeclined)
        },
      },
    )
  }

  const handleLogout = () => {
    clearPortalSession()
    window.location.href = '/login?portal=1'
  }

  const updateNotifyPref = (key: keyof CustomerNotificationPreferences, value: boolean) => {
    const next = { ...notifyPrefs, [key]: value }
    setNotifyPrefs(next)
    saveCustomerNotificationPreferences(portal.customerId, next)
    toast.success(t.customerPortal.preferencesSaved)
  }

  const submitReview = (rating: number, comment: string) => {
    reviewSubmit.mutate(
      { rating, comment },
      {
        onSuccess: (ok) => {
          if (!ok) return
          setReviewed(true)
          setShowReviewForm(false)
          toast.success(t.customerPortal.reviewSubmitted)
        },
      },
    )
  }

  if (estLoading || invLoading) return <div className="safe-x p-4 sm:p-6"><TableSkeleton /></div>

  return (
    <div className="gradient-bg safe-x min-h-[100dvh]">
      <div className="safe-top safe-bottom mx-auto max-w-3xl p-4 sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-3 sm:mb-8">
          <div className="min-w-0 text-center sm:text-left">
            <h1 className="text-xl font-bold sm:text-2xl" data-testid="customer-portal-title">{t.customerPortal.title}</h1>
            <p className="text-sm text-muted-foreground sm:text-base">{portal.customerName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="shrink-0">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{t.customerPortal.signOut}</span>
          </Button>
        </div>

        <Card className="mb-6" data-testid="customer-portal-notification-prefs">
          <CardContent className="space-y-4 p-4">
            <p className="font-medium">{t.customerPortal.notificationPreferences}</p>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="notify-email">{t.customerPortal.notifyEmail}</Label>
              <Switch
                id="notify-email"
                checked={notifyPrefs.email}
                data-testid="customer-portal-notify-email"
                onCheckedChange={(checked) => updateNotifyPref('email', checked)}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="notify-sms">{t.customerPortal.notifySms}</Label>
              <Switch
                id="notify-sms"
                checked={notifyPrefs.sms}
                data-testid="customer-portal-notify-sms"
                onCheckedChange={(checked) => updateNotifyPref('sms', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg" data-testid="customer-portal-estimates-heading">{t.customerPortal.yourEstimates}</h2>
        <div className="mb-6 space-y-3 sm:mb-8">
          {myEstimates.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">{t.customerPortal.noEstimates}</CardContent></Card>
          ) : (
            myEstimates.map((est) => (
              <Card key={est.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium">{est.title}</p>
                    <EstimateStatusBadge status={est.status} />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(est.total)}</p>
                  <p className="text-sm text-muted-foreground">{t.common.validUntil} {formatDate(est.valid_until, dateLocale)}</p>
                  {est.status === 'sent' && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        className="flex-1"
                        onClick={() => updateEstimateStatus(est, 'approved')}
                        disabled={estimateAction.isPending}
                        data-testid={`portal-estimate-approve-${est.id}`}
                      >
                        {t.customerPortal.approveSign}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => updateEstimateStatus(est, 'rejected')}
                        disabled={estimateAction.isPending}
                        data-testid={`portal-estimate-decline-${est.id}`}
                      >
                        {t.common.decline}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg" data-testid="customer-portal-invoices-heading">{t.customerPortal.invoices}</h2>
        <div className="mb-6 space-y-3 sm:mb-8">
          {myInvoices.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">{t.customerPortal.noInvoices}</CardContent></Card>
          ) : (
            myInvoices.slice(0, 3).map((inv) => (
              <Card key={inv.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{inv.invoice_number}</p>
                    <p className="text-lg font-bold">{formatCurrency(inv.total)}</p>
                  </div>
                  <StripePayButton
                    invoice={inv}
                    portalToken={getPortalToken() ?? undefined}
                    onSuccess={() => window.location.reload()}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 text-center">
              <Star className="mx-auto mb-3 h-8 w-8 text-accent" />
              <p className="font-medium">{t.customerPortal.reviewPrompt}</p>
            </div>

            {reviewed ? (
              <p className="text-center text-sm text-muted-foreground">{t.customerPortal.alreadyReviewed}</p>
            ) : showReviewForm ? (
              <PortalReviewForm
                disabled={reviewSubmit.isPending}
                onSubmit={submitReview}
              />
            ) : (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setShowReviewForm(true)} data-testid="customer-portal-leave-review">
                  {t.customerPortal.leaveReview}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
