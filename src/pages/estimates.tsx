import { useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { EstimateStatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DEMO_ESTIMATES, DEMO_CUSTOMERS, DEMO_SERVICES, DEMO_JOBS } from '@/data/mock-data'
import { formatCurrency, formatDate } from '@/lib/utils'
import { generateSmartEstimate } from '@/lib/ai'
import { useTranslation } from '@/contexts/locale-context'

export default function EstimatesPage() {
  const { t, locale } = useTranslation()
  const dateLocale = locale === 'ru' ? 'ru-RU' : 'en-US'
  const [showEngine, setShowEngine] = useState(false)

  const smartEstimate = generateSmartEstimate(
    'Drywall Repair',
    DEMO_JOBS.filter((j) => j.title.toLowerCase().includes('drywall')).map((j) => ({
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
            <Button>
              <Plus className="h-4 w-4" />
              {t.estimates.newEstimate}
            </Button>
          </>
        }
      />

      {showEngine && (
        <Card className="mb-6 border-primary/30">
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
                {DEMO_SERVICES.slice(0, 4).map((svc) => (
                  <div key={svc.id} className="flex justify-between text-sm rounded-lg bg-secondary/30 p-3">
                    <span>{svc.name}</span>
                    <span className="text-muted-foreground">{svc.avg_labor_hours}{t.common.hours} · {formatCurrency(svc.suggested_price)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">{t.estimates.aiRecommendation}</h4>
                <div className="rounded-lg bg-primary/10 p-4 space-y-2">
                  <p className="text-sm">Drywall Repair ({t.estimates.basedOnJobs.replace('{count}', String(DEMO_JOBS.length))})</p>
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

      <DataTable headers={[t.estimates.estimate, t.customers.customer, t.jobs.status, t.estimates.labor, t.estimates.materials, t.estimates.total, t.estimates.validUntil]}>
        {DEMO_ESTIMATES.map((est) => {
          const customer = DEMO_CUSTOMERS.find((c) => c.id === est.customer_id)
          return (
            <DataTableRow key={est.id}>
              <DataTableCell className="font-medium">{est.title}</DataTableCell>
              <DataTableCell>{customer?.name}</DataTableCell>
              <DataTableCell><EstimateStatusBadge status={est.status} /></DataTableCell>
              <DataTableCell>{est.labor_hours}{t.common.hours} @ {formatCurrency(est.labor_rate)}/{t.common.hr}</DataTableCell>
              <DataTableCell>{formatCurrency(est.material_cost)}</DataTableCell>
              <DataTableCell className="font-semibold">{formatCurrency(est.total)}</DataTableCell>
              <DataTableCell className="text-muted-foreground">{formatDate(est.valid_until, dateLocale)}</DataTableCell>
            </DataTableRow>
          )
        })}
      </DataTable>
    </div>
  )
}
