import { Plus, Sparkles, FileSpreadsheet, Send, X, Download } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { TableSkeleton } from '@/components/shared/skeleton'
import { EstimateStatusBadge } from '@/components/shared/status-badge'
import { EstimateForm } from '@/components/forms/estimate-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useEstimates, useJobs, useCustomers, useServices, useSaveEstimate, useConvertEstimateToInvoice, useInvoices } from '@/hooks/use-entities'
import { generateInvoiceNumber } from '@/services/payment-service'
import { notifyEstimateSent } from '@/services/notification-service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { generateSmartEstimate } from '@/lib/ai'
import { exportEstimatePdf } from '@/lib/export'
import { useTranslation } from '@/contexts/locale-context'
import { useDateLocale } from '@/hooks/use-date-locale'
import { toast } from 'sonner'
import type { Estimate } from '@/types'

export default function EstimatesPage() {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const [showEngine, setShowEngine] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const { company } = useAuth()
  const companyId = company?.id ?? 'comp-001'
  const { data: estimates = [], isLoading: estimatesLoading } = useEstimates()
  const { data: jobs = [], isLoading: jobsLoading } = useJobs()
  const { data: customers = [], isLoading: customersLoading } = useCustomers()
  const { data: services = [] } = useServices()
  const { data: invoices = [] } = useInvoices()
  const saveEstimate = useSaveEstimate()
  const convertToInvoice = useConvertEstimateToInvoice()

  const smartEstimate = generateSmartEstimate(
    'Drywall Repair',
    jobs.filter((j) => j.title.toLowerCase().includes('drywall')).map((j) => ({
      estimated_hours: j.estimated_hours,
      actual_hours: j.actual_hours,
      revenue: j.revenue,
      profit_margin: j.profit_margin,
    }))
  )

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
    await notifyEstimateSent(customer.email, est.title, est.total)
    saveEstimate.mutate({ ...est, status: 'sent' })
    toast.success(`Смета отправлена: ${customer.email}`)
  }

  const handleConvert = (est: Estimate) => {
    convertToInvoice.mutate(
      { estimate: est, invoiceNumber: generateInvoiceNumber(invoices) },
      { onSuccess: () => toast.success('Счёт создан из сметы') }
    )
  }

  const handleExportPdf = (est: Estimate, customerName: string) => {
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
                  <p className="text-sm">Drywall Repair ({t.estimates.basedOnJobs.replace('{count}', String(jobs.length))})</p>
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
          </CardContent>
        </Card>
      )}

      {estimatesLoading || jobsLoading || customersLoading ? (
        <TableSkeleton cols={8} />
      ) : (
      <DataTable headers={[t.estimates.estimate, t.customers.customer, t.jobs.status, t.estimates.labor, t.estimates.materials, t.estimates.total, t.estimates.validUntil, '']}>
        {estimates.map((est) => {
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
      )}
    </div>
  )
}
