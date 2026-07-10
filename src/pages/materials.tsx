import { useState } from 'react'
import { Plus, AlertTriangle, X } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { TableSkeleton } from '@/components/shared/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MaterialForm } from '@/components/forms/material-form'
import { useAuth } from '@/contexts/auth-context'
import { useMaterials, useSaveMaterial } from '@/hooks/use-entities'
import { formatCurrencyPrecise } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'
import { toast } from 'sonner'
import type { Material } from '@/types'

export default function MaterialsPage() {
  const { t } = useTranslation()
  const { company } = useAuth()
  const companyId = company?.id ?? 'comp-001'
  const [showForm, setShowForm] = useState(false)
  const { data: materials = [], isLoading } = useMaterials()
  const saveMaterial = useSaveMaterial()
  const lowStock = materials.filter((m) => m.quantity <= m.reorder_level)

  const handleCreate = (material: Material) => {
    saveMaterial.mutate(material, {
      onSuccess: () => {
        toast.success(t.common.save)
        setShowForm(false)
      },
    })
  }

  if (isLoading) return <TableSkeleton />

  return (
    <div>
      <PageHeader
        title={t.materials.title}
        description={t.materials.description}
        actions={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />{t.materials.addMaterial}</Button>}
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t.materials.addMaterial}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <MaterialForm companyId={companyId} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </CardContent>
        </Card>
      )}

      {lowStock.length > 0 && (
        <div className="glass-card border-warning/30 p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <div>
            <p className="font-medium text-warning">{t.materials.lowStockAlert}</p>
            <p className="text-sm text-muted-foreground">
              {lowStock.map((m) => m.name).join(', ')} {t.materials.reorderSuggested}
            </p>
          </div>
        </div>
      )}

      <DataTable headers={[t.materials.material, t.materials.category, t.materials.supplier, t.materials.cost, t.materials.markup, t.materials.customerPrice, t.materials.qty, t.materials.stockStatus]}>
        {materials.map((mat) => {
          const isLow = mat.quantity <= mat.reorder_level
          return (
            <DataTableRow key={mat.id}>
              <DataTableCell className="font-medium">{mat.name}</DataTableCell>
              <DataTableCell>{mat.category}</DataTableCell>
              <DataTableCell>{mat.supplier}</DataTableCell>
              <DataTableCell>{formatCurrencyPrecise(mat.cost)}</DataTableCell>
              <DataTableCell>{mat.markup_percent}%</DataTableCell>
              <DataTableCell className="font-medium">{formatCurrencyPrecise(mat.customer_price)}</DataTableCell>
              <DataTableCell>{mat.quantity}</DataTableCell>
              <DataTableCell>
                <Badge variant={isLow ? 'warning' : 'success'}>
                  {isLow ? t.materials.lowStock : t.materials.inStock}
                </Badge>
              </DataTableCell>
            </DataTableRow>
          )
        })}
      </DataTable>
    </div>
  )
}
