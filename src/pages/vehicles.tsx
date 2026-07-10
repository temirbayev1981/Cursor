import { Plus, Fuel } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { DEMO_VEHICLES, DEMO_FUEL_LOGS } from '@/data/mock-data'
import { formatCurrencyPrecise, formatDate } from '@/lib/utils'

export default function VehiclesPage() {
  const totalFuelCost = DEMO_FUEL_LOGS.reduce((s, l) => s + l.total_cost, 0)
  const totalMiles = DEMO_FUEL_LOGS.reduce((s, l) => s + l.miles, 0)

  return (
    <div>
      <PageHeader
        title="Vehicles & Fuel"
        description="Fleet management and fuel cost tracking"
        actions={<Button><Plus className="h-4 w-4" />Add Vehicle</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3"><Fuel className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Fuel Cost</p>
              <p className="text-2xl font-bold">{formatCurrencyPrecise(totalFuelCost)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Miles</p>
            <p className="text-2xl font-bold">{totalMiles}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Cost per Mile</p>
            <p className="text-2xl font-bold">{formatCurrencyPrecise(totalMiles > 0 ? totalFuelCost / totalMiles : 0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {DEMO_VEHICLES.map((vehicle) => (
          <Card key={vehicle.id}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold">{vehicle.name}</p>
                <Badge variant="outline">{vehicle.type}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{vehicle.year} {vehicle.make} {vehicle.model}</p>
              <p className="text-sm text-muted-foreground">{vehicle.license_plate}</p>
              <p className="text-sm mt-2">{vehicle.mileage.toLocaleString()} miles</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fuel Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable headers={['Date', 'Vehicle', 'Miles', 'Gallons', 'Price/Gal', 'Total']}>
            {DEMO_FUEL_LOGS.map((log) => {
              const vehicle = DEMO_VEHICLES.find((v) => v.id === log.vehicle_id)
              return (
                <DataTableRow key={log.id}>
                  <DataTableCell>{formatDate(log.date)}</DataTableCell>
                  <DataTableCell>{vehicle?.name}</DataTableCell>
                  <DataTableCell>{log.miles}</DataTableCell>
                  <DataTableCell>{log.gallons}</DataTableCell>
                  <DataTableCell>{formatCurrencyPrecise(log.fuel_price)}</DataTableCell>
                  <DataTableCell className="font-medium">{formatCurrencyPrecise(log.total_cost)}</DataTableCell>
                </DataTableRow>
              )
            })}
          </DataTable>
        </CardContent>
      </Card>
    </div>
  )
}
