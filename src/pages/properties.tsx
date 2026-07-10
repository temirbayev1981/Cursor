import { useState } from 'react'
import { Plus, X, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TableSkeleton } from '@/components/shared/skeleton'
import { PropertyForm } from '@/components/forms/property-form'
import { useProperties, useCustomers, useSaveProperty } from '@/hooks/use-entities'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from '@/contexts/locale-context'
import { toast } from 'sonner'
import type { Property } from '@/types'

export default function PropertiesPage() {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const { company } = useAuth()
  const companyId = company?.id ?? 'comp-001'
  const { data: properties = [], isLoading: propsLoading } = useProperties()
  const { data: customers = [], isLoading: custLoading } = useCustomers()
  const saveProperty = useSaveProperty()

  const handleSave = (property: Property) => {
    saveProperty.mutate(property, {
      onSuccess: () => {
        toast.success(t.common.save)
        setShowForm(false)
        setEditingProperty(null)
      },
    })
  }

  if (propsLoading || custLoading) return <TableSkeleton rows={3} cols={3} />

  return (
    <div>
      <PageHeader
        title={t.properties.title}
        description={t.properties.description}
        actions={
          <Button onClick={() => { setEditingProperty(null); setShowForm(true) }}>
            <Plus className="h-4 w-4" />{t.properties.addProperty}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{editingProperty ? t.common.edit : t.properties.addProperty}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingProperty(null) }}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <PropertyForm
              companyId={companyId}
              customers={customers}
              initial={editingProperty ?? undefined}
              onSubmit={handleSave}
              onCancel={() => { setShowForm(false); setEditingProperty(null) }}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((prop) => {
          const customer = customers.find((c) => c.id === prop.customer_id)
          return (
            <Card key={prop.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{prop.name}</p>
                    <p className="text-sm text-muted-foreground">{prop.address}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title={t.common.edit}
                      data-testid={`property-edit-${prop.id}`}
                      onClick={() => { setEditingProperty(prop); setShowForm(true) }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Badge variant="outline">{prop.property_type}</Badge>
                  </div>
                </div>
                {prop.unit_number && (
                  <p className="text-sm">{t.common.unit}: <span className="font-medium">{prop.unit_number}</span></p>
                )}
                <p className="text-sm text-muted-foreground">{t.common.owner}: {customer?.name}</p>
                {prop.access_notes && (
                  <p className="text-xs bg-secondary/50 rounded p-2">{prop.access_notes}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
