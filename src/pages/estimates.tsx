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

export default function EstimatesPage() {
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

  return (
    <div>
      <PageHeader
        title="Estimates"
        description="Smart estimating engine powered by historical job data"
        actions={
          <>
            <Button variant="outline" onClick={() => setShowEngine(!showEngine)}>
              <Sparkles className="h-4 w-4" />
              Smart Engine
            </Button>
            <Button>
              <Plus className="h-4 w-4" />
              New Estimate
            </Button>
          </>
        }
      />

      {showEngine && (
        <Card className="mb-6 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Smart Estimating Engine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Service Catalog</h4>
                {DEMO_SERVICES.slice(0, 4).map((svc) => (
                  <div key={svc.id} className="flex justify-between text-sm rounded-lg bg-secondary/30 p-3">
                    <span>{svc.name}</span>
                    <span className="text-muted-foreground">{svc.avg_labor_hours}h · {formatCurrency(svc.suggested_price)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">AI Recommendation</h4>
                <div className="rounded-lg bg-primary/10 p-4 space-y-2">
                  <p className="text-sm">Drywall Repair (based on {DEMO_JOBS.length} historical jobs)</p>
                  <p className="text-2xl font-bold">{formatCurrency(smartEstimate.price)}</p>
                  <p className="text-sm text-muted-foreground">{smartEstimate.hours} hours estimated</p>
                  <p className="text-xs text-accent">Confidence: {(smartEstimate.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Pricing Options</h4>
                {[
                  { label: 'Hourly Billing', rate: '$75/hr' },
                  { label: 'Flat Rate', rate: 'Per service catalog' },
                  { label: 'Emergency', rate: '1.5x multiplier' },
                  { label: 'Weekend', rate: '1.25x multiplier' },
                  { label: 'Property Mgmt', rate: '10% discount' },
                ].map((opt) => (
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

      <DataTable headers={['Estimate', 'Customer', 'Status', 'Labor', 'Materials', 'Total', 'Valid Until']}>
        {DEMO_ESTIMATES.map((est) => {
          const customer = DEMO_CUSTOMERS.find((c) => c.id === est.customer_id)
          return (
            <DataTableRow key={est.id}>
              <DataTableCell className="font-medium">{est.title}</DataTableCell>
              <DataTableCell>{customer?.name}</DataTableCell>
              <DataTableCell><EstimateStatusBadge status={est.status} /></DataTableCell>
              <DataTableCell>{est.labor_hours}h @ {formatCurrency(est.labor_rate)}/hr</DataTableCell>
              <DataTableCell>{formatCurrency(est.material_cost)}</DataTableCell>
              <DataTableCell className="font-semibold">{formatCurrency(est.total)}</DataTableCell>
              <DataTableCell className="text-muted-foreground">{formatDate(est.valid_until)}</DataTableCell>
            </DataTableRow>
          )
        })}
      </DataTable>
    </div>
  )
}
