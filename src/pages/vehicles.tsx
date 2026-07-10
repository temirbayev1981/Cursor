import { useState } from 'react'
import { Plus, Fuel, X } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { TableSkeleton } from '@/components/shared/skeleton'
import { VehicleForm } from '@/components/forms/vehicle-form'
import { useAuth } from '@/contexts/auth-context'
import { useVehicles, useFuelLogs, useSaveVehicle } from '@/hooks/use-entities'
import { formatCurrencyPrecise, formatDate } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'
import { useDateLocale } from '@/hooks/use-date-locale'
import { toast } from 'sonner'
import type { Vehicle } from '@/types'

export default function VehiclesPage() {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { company } = useAuth()
  const companyId = company?.id ?? 'comp-001'
  const [showForm, setShowForm] = useState(false)
  const { data: vehicles = [], isLoading: vehLoading } = useVehicles()
  const { data: fuelLogs = [], isLoading: fuelLoading } = useFuelLogs()
  const saveVehicle = useSaveVehicle()
  const totalFuelCost = fuelLogs.reduce((s, l) => s + l.total_cost, 0)
  const totalMiles = fuelLogs.reduce((s, l) => s + l.miles, 0)

  const handleCreate = (vehicle: Vehicle) => {
    saveVehicle.mutate(vehicle, {
      onSuccess: () => {
        toast.success(t.common.save)
        setShowForm(false)
      },
    })
  }

  if (vehLoading || fuelLoading) return <TableSkeleton />

  return (
    <div>
      <PageHeader
        title={t.vehicles.title}
        description={t.vehicles.description}
        actions={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />{t.vehicles.addVehicle}</Button>}
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t.vehicles.addVehicle}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <VehicleForm companyId={companyId} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3"><Fuel className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">{t.vehicles.monthlyFuel}</p>
              <p className="text-2xl font-bold">{formatCurrencyPrecise(totalFuelCost)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{t.vehicles.totalMiles}</p>
            <p className="text-2xl font-bold">{totalMiles}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{t.vehicles.costPerMile}</p>
            <p className="text-2xl font-bold">{formatCurrencyPrecise(totalMiles > 0 ? totalFuelCost / totalMiles : 0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold">{vehicle.name}</p>
                <Badge variant="outline">{vehicle.type}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{vehicle.year} {vehicle.make} {vehicle.model}</p>
              <p className="text-sm text-muted-foreground">{vehicle.license_plate}</p>
              <p className="text-sm mt-2">{vehicle.mileage.toLocaleString()} {t.vehicles.miles}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card data-testid="vehicles-fuel-logs">
        <CardHeader>
          <CardTitle>{t.vehicles.fuelLogs}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable headers={[t.vehicles.date, t.vehicles.vehicle, t.vehicles.miles, t.vehicles.gallons, t.vehicles.pricePerGal, t.vehicles.total]}>
            {fuelLogs.map((log) => {
              const vehicle = vehicles.find((v) => v.id === log.vehicle_id)
              return (
                <DataTableRow key={log.id}>
                  <DataTableCell>{formatDate(log.date, dateLocale)}</DataTableCell>
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
