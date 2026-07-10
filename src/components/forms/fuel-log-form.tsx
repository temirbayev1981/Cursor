import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { fuelLogSchema, type FuelLogFormValues } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslation } from '@/contexts/locale-context'
import type { FuelLog, Vehicle } from '@/types'

interface FuelLogFormProps {
  vehicles: Vehicle[]
  onSubmit: (log: FuelLog) => void
  onCancel?: () => void
}

export function FuelLogForm({ vehicles, onSubmit, onCancel }: FuelLogFormProps) {
  const { t } = useTranslation()
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FuelLogFormValues>({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: {
      vehicle_id: vehicles[0]?.id ?? '',
      date: new Date().toISOString().slice(0, 10),
      miles: 0,
      gallons: 10,
      fuel_price: 3.5,
    },
  })

  const vehicleId = watch('vehicle_id')

  const submit = (values: FuelLogFormValues) => {
    const totalCost = Math.round(values.gallons * values.fuel_price * 100) / 100
    onSubmit({
      id: crypto.randomUUID(),
      vehicle_id: values.vehicle_id,
      date: new Date(values.date).toISOString(),
      miles: values.miles,
      gallons: values.gallons,
      fuel_price: values.fuel_price,
      total_cost: totalCost,
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" data-testid="fuel-log-form">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t.vehicles.vehicle}</Label>
          <Select value={vehicleId} onValueChange={(v) => setValue('vehicle_id', v)}>
            <SelectTrigger className="mt-1" data-testid="fuel-log-vehicle-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.vehicle_id && <p className="text-xs text-destructive mt-1">{errors.vehicle_id.message}</p>}
        </div>
        <div>
          <Label>{t.vehicles.date}</Label>
          <Input className="mt-1" type="date" {...register('date')} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>{t.vehicles.miles}</Label>
          <Input className="mt-1" type="number" step="1" {...register('miles')} />
        </div>
        <div>
          <Label>{t.vehicles.gallons}</Label>
          <Input className="mt-1" type="number" step="0.1" {...register('gallons')} />
        </div>
        <div>
          <Label>{t.vehicles.pricePerGal}</Label>
          <Input className="mt-1" type="number" step="0.01" {...register('fuel_price')} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>{t.common.cancel}</Button>}
        <Button type="submit" disabled={isSubmitting} data-testid="fuel-log-form-submit">{t.common.save}</Button>
      </div>
    </form>
  )
}
