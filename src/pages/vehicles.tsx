import { useState } from 'react'
import { Plus, Fuel, X, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { TableSkeleton } from '@/components/shared/skeleton'
import { VehicleForm } from '@/components/forms/vehicle-form'
import { FuelLogForm } from '@/components/forms/fuel-log-form'
import { useAuth } from '@/contexts/auth-context'
import { useVehicles, useFuelLogs, useSaveVehicle, useSaveFuelLog } from '@/hooks/use-entities'
import { formatCurrencyPrecise, formatDate } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'
import { useDateLocale } from '@/hooks/use-date-locale'
import { toast } from 'sonner'
import type { Vehicle, FuelLog } from '@/types'

export default function VehiclesPage() {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { company } = useAuth()
  const companyId = company?.id ?? ''
  const [showForm, setShowForm] = useState(false)
  const [showFuelForm, setShowFuelForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [editingFuelLog, setEditingFuelLog] = useState<FuelLog | null>(null)
  const { data: vehicles = [], isLoading: vehLoading } = useVehicles()
  const { data: fuelLogs = [], isLoading: fuelLoading } = useFuelLogs()
  const saveVehicle = useSaveVehicle()
  const saveFuelLog = useSaveFuelLog()
  const totalFuelCost = fuelLogs.reduce((s, l) => s + l.total_cost, 0)
  const totalMiles = fuelLogs.reduce((s, l) => s + l.miles, 0)

  const handleSaveVehicle = (vehicle: Vehicle) => {
    saveVehicle.mutate(vehicle, {
      onSuccess: () => {
        toast.success(t.common.save)
        setShowForm(false)
        setEditingVehicle(null)
      },
    })
  }

  const handleSaveFuelLog = (log: FuelLog) => {
    saveFuelLog.mutate(log, {
      onSuccess: () => {
        toast.success(t.common.save)
        setShowFuelForm(false)
        setEditingFuelLog(null)
      },
    })
  }

  if (vehLoading || fuelLoading) return <TableSkeleton />

  return (
    <div>
      <PageHeader
        title={t.vehicles.title}
        description={t.vehicles.description}
        actions={<Button onClick={() => { setEditingVehicle(null); setShowForm(true) }}><Plus className="h-4 w-4" />{t.vehicles.addVehicle}</Button>}
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{editingVehicle ? t.common.edit : t.vehicles.addVehicle}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingVehicle(null) }}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <VehicleForm
              companyId={companyId}
              initial={editingVehicle ?? undefined}
              onSubmit={handleSaveVehicle}
              onCancel={() => { setShowForm(false); setEditingVehicle(null) }}
            />
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
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title={t.common.edit}
                    data-testid={`vehicle-edit-${vehicle.id}`}
                    onClick={() => { setEditingVehicle(vehicle); setShowForm(true) }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Badge variant="outline">{vehicle.type}</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{vehicle.year} {vehicle.make} {vehicle.model}</p>
              <p className="text-sm text-muted-foreground">{vehicle.license_plate}</p>
              <p className="text-sm mt-2">{vehicle.mileage.toLocaleString()} {t.vehicles.miles}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card data-testid="vehicles-fuel-logs">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t.vehicles.fuelLogs}</CardTitle>
          <Button size="sm" onClick={() => { setEditingFuelLog(null); setShowFuelForm(true) }} disabled={vehicles.length === 0}>
            <Plus className="h-4 w-4" />{t.vehicles.addFuelLog}
          </Button>
        </CardHeader>
        {showFuelForm && vehicles.length > 0 && (
          <CardContent className="border-b">
            <FuelLogForm
              vehicles={vehicles}
              initial={editingFuelLog ?? undefined}
              onSubmit={handleSaveFuelLog}
              onCancel={() => { setShowFuelForm(false); setEditingFuelLog(null) }}
            />
          </CardContent>
        )}
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
                  <DataTableCell className="font-medium">
                    <div className="flex items-center justify-between gap-2">
                      <span>{formatCurrencyPrecise(log.total_cost)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t.common.edit}
                        data-testid={`fuel-log-edit-${log.id}`}
                        onClick={() => { setEditingFuelLog(log); setShowFuelForm(true) }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              )
            })}
          </DataTable>
        </CardContent>
      </Card>
    </div>
  )
}
