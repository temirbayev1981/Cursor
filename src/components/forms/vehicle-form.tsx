import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { vehicleSchema, type VehicleFormValues } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslation } from '@/contexts/locale-context'
import type { Vehicle } from '@/types'

interface VehicleFormProps {
  companyId: string
  initial?: Vehicle
  onSubmit: (vehicle: Vehicle) => void
  onCancel?: () => void
}

export function VehicleForm({ companyId, initial, onSubmit, onCancel }: VehicleFormProps) {
  const { t } = useTranslation()
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          type: initial.type,
          make: initial.make,
          model: initial.model,
          year: initial.year,
          license_plate: initial.license_plate,
          mileage: initial.mileage,
        }
      : { type: 'van', year: new Date().getFullYear(), mileage: 0 },
  })

  const type = watch('type')

  const submit = (values: VehicleFormValues) => {
    onSubmit({
      id: initial?.id ?? crypto.randomUUID(),
      company_id: companyId,
      name: values.name,
      type: values.type,
      make: values.make,
      model: values.model,
      year: values.year,
      license_plate: values.license_plate,
      mileage: values.mileage,
      is_active: initial?.is_active ?? true,
      created_at: initial?.created_at ?? new Date().toISOString(),
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" data-testid="vehicle-form">
      <div>
        <Label>Name</Label>
        <Input className="mt-1" {...register('name')} placeholder="Service Van #1" />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label>Type</Label>
        <Select value={type} onValueChange={(v) => setValue('type', v as VehicleFormValues['type'])}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="van">Van</SelectItem>
            <SelectItem value="truck">Truck</SelectItem>
            <SelectItem value="trailer">Trailer</SelectItem>
            <SelectItem value="car">Car</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Make</Label>
          <Input className="mt-1" {...register('make')} />
        </div>
        <div>
          <Label>Model</Label>
          <Input className="mt-1" {...register('model')} />
        </div>
        <div>
          <Label>Year</Label>
          <Input className="mt-1" type="number" {...register('year')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>License plate</Label>
          <Input className="mt-1" {...register('license_plate')} />
        </div>
        <div>
          <Label>{t.vehicles.miles}</Label>
          <Input className="mt-1" type="number" {...register('mileage')} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>{t.common.cancel}</Button>}
        <Button type="submit" disabled={isSubmitting} data-testid="vehicle-form-submit">{t.common.save}</Button>
      </div>
    </form>
  )
}
