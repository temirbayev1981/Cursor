import { Plus, Sparkles, FileSpreadsheet, Send, X, Download } from 'lucide-react'
import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { TablePagination } from '@/components/shared/table-pagination'
import { TableSkeleton } from '@/components/shared/skeleton'
import { EstimateStatusBadge } from '@/components/shared/status-badge'
import { EstimateForm } from '@/components/forms/estimate-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useCustomerContacts, useServices, useSaveEstimate, useConvertEstimateToInvoice, useSmartEngineJobContext } from '@/hooks/use-entities'
import { useServerEntityTable } from '@/hooks/use-server-entity-table'
import { listInvoiceNumbers } from '@/services/entity-service'
import { generateInvoiceNumber } from '@/services/payment-service'
import { notifyEstimateSent, notifyEstimateSentSms, notifyResultMessage } from '@/services/notification-service'
import { logAudit } from '@/services/entity-service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'
import { useDateLocale } from '@/hooks/use-date-locale'
import { toast } from 'sonner'
import type { Estimate } from '@/types'

export default function EstimatesPage() {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const [showEngine, setShowEngine] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const { company, user } = useAuth()
  const companyId = company?.id ?? ''
  const { isLoading: estimatesLoading, pagination } = useServerEntityTable('estimates')
  const { data: customers = [], isLoading: customersLoading } = useCustomerContacts()
  const { data: services = [] } = useServices()
  const { data: smartEngineContext, isLoading: smartEngineLoading } = useSmartEngineJobContext(showEngine)
  const saveEstimate = useSaveEstimate()
  const convertToInvoice = useConvertEstimateToInvoice()

  const [smartEstimate, setSmartEstimate] = useState({ hours: 4, price: 450, confidence: 0.5 })

  useEffect(() => {
    if (!showEngine || !smartEngineContext) return
    let cancelled = false
    void import('@/lib/ai').then(({ generateSmartEstimate }) => {
      if (cancelled) return
      setSmartEstimate(generateSmartEstimate('Drywall Repair', smartEngineContext.drywallStats))
    })
    return () => {
      cancelled = true
    }
  }, [showEngine, smartEngineContext])

  const pricingOptions = [
    { label: t.estimates.hourlyBilling, rate: '$75/' + t.common.hr },
    { label: t.estimates.flatRate, rate: t.estimates.perCatalog },
    { label: t.estimates.emergency, rate: t.estimates.emergencyMult },
    { label: t.estimates.weekend, rate: t.estimates.weekendMult },
    { label: t.estimates.propertyMgmt, rate: t.estimates.discount10 },
  ]

  const handleCreate = (estimate: Estimate) => {
    saveEstimate.mutate(estimate, {
      onSuccess: () => {
        toast.success(t.common.save)
        setShowForm(false)
      },
    })
  }

  const handleSend = async (est: Estimate) => {
    const customer = customers.find((c) => c.id === est.customer_id)
    if (!customer?.email) return
    const result = await notifyEstimateSent(customer.email, est.title, est.total, customer.id, customer)

    if (customer.phone) {
      const smsResult = await notifyEstimateSentSms(customer.phone, est.title, est.total, customer.id, customer)
      const smsFeedback = notifyResultMessage(
        smsResult,
        t.estimates.smsSent.replace('{phone}', customer.phone),
        t.estimates.smsQueued.replace('{phone}', customer.phone),
        t.common.notificationFailed,
        t.estimates.smsSkipped.replace('{phone}', customer.phone),
      )
      if (smsFeedback.type === 'success') toast.success(smsFeedback.message)
      else if (smsFeedback.type === 'info') toast.info(smsFeedback.message)
    }

    saveEstimate.mutate(
      { ...est, status: 'sent' },
      {
        onSuccess: () => {
          if (user) void logAudit(companyId, user.id, 'estimate.sent', 'estimate', est.id)
          if (result.skipped) {
            toast.info(t.estimates.estimateSentSkipped.replace('{email}', customer.email))
          } else {
            toast.success(t.estimates.estimateSent.replace('{email}', customer.email))
          }
        },
      },
    )
  }

  const handleConvert = (est: Estimate) => {
    void listInvoiceNumbers(companyId).then((numbers) => {
      convertToInvoice.mutate(
        { estimate: est, invoiceNumber: generateInvoiceNumber(numbers) },
        { onSuccess: () => toast.success(t.estimates.invoiceCreatedFromEstimate) },
      )
    })
  }

  const handleExportPdf = async (est: Estimate, customerName: string) => {
    const { exportEstimatePdf } = await import('@/lib/export')
    exportEstimatePdf({
      title: est.title,
      customerName,
      status: est.status,
      laborHours: est.labor_hours,
      laborRate: est.labor_rate,
      materialCost: est.material_cost,
      total: est.total,
      validUntil: est.valid_until,
      lineItems: est.line_items,
      companyName: company?.name,
      labels: {
        labor: t.estimates.labor,
        materials: t.estimates.materials,
        validUntil: t.estimates.validUntil,
        lineItems: t.estimates.pdf.lineItems,
        description: t.estimates.pdf.description,
        qty: t.estimates.pdf.qty,
        unit: t.estimates.pdf.unit,
        total: t.estimates.total,
        noLineItems: t.estimates.pdf.noLineItems,
        laborHoursSuffix: `${t.common.hours} @ `,
        perHour: `/${t.common.hr}`,
      },
    })
  }

  const totalJobs = smartEngineContext?.totalJobs ?? 0

  return (
    <div>
      <PageHeader
        title={t.estimates.title}
        description={t.estimates.description}
        actions={
          <>
            <Button variant="outline" onClick={() => setShowEngine(!showEngine)}>
              <Sparkles className="h-4 w-4" />
              {t.estimates.smartEngine}
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              {t.estimates.newEstimate}
            </Button>
          </>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t.estimates.newEstimate}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <EstimateForm companyId={companyId} customers={customers} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </CardContent>
        </Card>
      )}

      {showEngine && (
        <Card className="mb-6 border-primary/30" data-testid="estimates-smart-engine-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              {t.estimates.smartEngine}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {smartEngineLoading ? (
              <p className="text-sm text-muted-foreground">…</p>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">{t.estimates.serviceCatalog}</h4>
                {services.slice(0, 4).map((svc) => (
                  <div key={svc.id} className="flex justify-between text-sm rounded-lg bg-secondary/30 p-3">
                    <span>{svc.name}</span>
                    <span className="text-muted-foreground">{svc.avg_labor_hours}{t.common.hours} · {formatCurrency(svc.suggested_price)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">{t.estimates.aiRecommendation}</h4>
                <div className="rounded-lg bg-primary/10 p-4 space-y-2">
                  <p className="text-sm">Drywall Repair ({t.estimates.basedOnJobs.replace('{count}', String(totalJobs))})</p>
                  <p className="text-2xl font-bold">{formatCurrency(smartEstimate.price)}</p>
                  <p className="text-sm text-muted-foreground">{smartEstimate.hours} {t.common.hours} {t.jobs.estimated}</p>
                  <p className="text-xs text-accent">{t.estimates.confidence}: {(smartEstimate.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">{t.estimates.pricingOptions}</h4>
                {pricingOptions.map((opt) => (
                  <div key={opt.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{opt.label}</span>
                    <span>{opt.rate}</span>
                  </div>
                ))}
              </div>
            </div>
            )}
          </CardContent>
        </Card>
      )}

      {estimatesLoading || customersLoading ? (
        <TableSkeleton cols={8} />
      ) : (
      <>
      <div className="md:hidden space-y-3">
        {pagination.paginatedItems.map((est) => {
          const customer = customers.find((c) => c.id === est.customer_id)
          return (
            <Card key={est.id} className="p-4" data-testid={`estimate-card-${est.id}`}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium line-clamp-2">{est.title}</p>
                  <EstimateStatusBadge status={est.status} />
                </div>
                <p className="text-sm text-muted-foreground">{customer?.name ?? '—'}</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                  <span className="text-muted-foreground">{t.estimates.labor}</span>
                  <span>{est.labor_hours}{t.common.hours} @ {formatCurrency(est.labor_rate)}/{t.common.hr}</span>
                  <span className="text-muted-foreground">{t.estimates.materials}</span>
                  <span>{formatCurrency(est.material_cost)}</span>
                  <span className="text-muted-foreground">{t.estimates.total}</span>
                  <span className="font-semibold">{formatCurrency(est.total)}</span>
                  <span className="text-muted-foreground">{t.estimates.validUntil}</span>
                  <span>{formatDate(est.valid_until, dateLocale)}</span>
                </div>
                <div className="flex gap-1 pt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    title={t.common.exportPdf}
                    onClick={() => handleExportPdf(est, customer?.name ?? '')}
                    data-testid={`estimate-export-pdf-${est.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {est.status === 'draft' && (
                    <Button size="sm" variant="ghost" onClick={() => handleSend(est)} data-testid={`estimate-send-${est.id}`}>
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                  {['sent', 'approved'].includes(est.status) && (
                    <Button size="sm" variant="ghost" onClick={() => handleConvert(est)} title="Создать счёт"
                      data-testid={`estimate-convert-${est.id}`}>
                      <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
        <TablePagination pagination={pagination} testId="estimates-pagination-mobile" />
      </div>

      <div className="hidden md:block">
      <DataTable
        headers={[t.estimates.estimate, t.customers.customer, t.jobs.status, t.estimates.labor, t.estimates.materials, t.estimates.total, t.estimates.validUntil, '']}
        pagination={pagination}
        paginationTestId="estimates-pagination"
      >
        {pagination.paginatedItems.map((est) => {
          const customer = customers.find((c) => c.id === est.customer_id)
          return (
            <DataTableRow key={est.id}>
              <DataTableCell className="font-medium">{est.title}</DataTableCell>
              <DataTableCell>{customer?.name}</DataTableCell>
              <DataTableCell><EstimateStatusBadge status={est.status} /></DataTableCell>
              <DataTableCell>{est.labor_hours}{t.common.hours} @ {formatCurrency(est.labor_rate)}/{t.common.hr}</DataTableCell>
              <DataTableCell>{formatCurrency(est.material_cost)}</DataTableCell>
              <DataTableCell className="font-semibold">{formatCurrency(est.total)}</DataTableCell>
              <DataTableCell className="text-muted-foreground">{formatDate(est.valid_until, dateLocale)}</DataTableCell>
              <DataTableCell>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    title={t.common.exportPdf}
                    onClick={() => handleExportPdf(est, customer?.name ?? '')}
                    data-testid={`estimate-export-pdf-${est.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {est.status === 'draft' && (
                    <Button size="sm" variant="ghost" onClick={() => handleSend(est)} data-testid={`estimate-send-${est.id}`}>
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                  {['sent', 'approved'].includes(est.status) && (
                    <Button size="sm" variant="ghost" onClick={() => handleConvert(est)} title="Создать счёт"
                      data-testid={`estimate-convert-${est.id}`}>
                      <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </DataTableCell>
            </DataTableRow>
          )
        })}
      </DataTable>
      </div>
      </>
      )}
    </div>
  )
}
