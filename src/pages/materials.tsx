import { useState } from 'react'
import { Plus, AlertTriangle, X, PackagePlus, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { TableSkeleton } from '@/components/shared/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MaterialForm } from '@/components/forms/material-form'
import { useAuth } from '@/contexts/auth-context'
import { useMaterials, useSaveMaterial, useInventoryTransactionsList, useReceiveStock } from '@/hooks/use-entities'
import { formatCurrencyPrecise, formatDate } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'
import { useDateLocale } from '@/hooks/use-date-locale'
import { toast } from 'sonner'
import type { Material } from '@/types'

export default function MaterialsPage() {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { company } = useAuth()
  const companyId = company?.id ?? 'comp-001'
  const [showForm, setShowForm] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [receiveMaterialId, setReceiveMaterialId] = useState<string | null>(null)
  const [receiveQty, setReceiveQty] = useState(10)
  const { data: materials = [], isLoading } = useMaterials()
  const { data: transactions = [] } = useInventoryTransactionsList()
  const saveMaterial = useSaveMaterial()
  const receiveStock = useReceiveStock()
  const lowStock = materials.filter((m) => m.quantity <= m.reorder_level)

  const handleSave = (material: Material) => {
    saveMaterial.mutate(material, {
      onSuccess: () => {
        toast.success(t.common.save)
        setShowForm(false)
        setEditingMaterial(null)
      },
    })
  }

  const handleReceive = (materialId: string) => {
    if (receiveQty <= 0) return
    receiveStock.mutate(
      { materialId, quantity: receiveQty },
      {
        onSuccess: () => {
          toast.success(t.materials.receiveStock)
          setReceiveMaterialId(null)
          setReceiveQty(10)
        },
      }
    )
  }

  const getMaterialName = (materialId: string) =>
    materials.find((m) => m.id === materialId)?.name ?? materialId

  if (isLoading) return <TableSkeleton />

  return (
    <div>
      <PageHeader
        title={t.materials.title}
        description={t.materials.description}
        actions={<Button onClick={() => { setEditingMaterial(null); setShowForm(true) }}><Plus className="h-4 w-4" />{t.materials.addMaterial}</Button>}
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{editingMaterial ? t.common.edit : t.materials.addMaterial}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingMaterial(null) }}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <MaterialForm
              companyId={companyId}
              initial={editingMaterial ?? undefined}
              onSubmit={handleSave}
              onCancel={() => { setShowForm(false); setEditingMaterial(null) }}
            />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <DataTable headers={[t.materials.material, t.materials.category, t.materials.cost, t.materials.qty, t.materials.stockStatus, '']}>
            {materials.map((mat) => {
              const isLow = mat.quantity <= mat.reorder_level
              return (
                <DataTableRow key={mat.id}>
                  <DataTableCell className="font-medium">{mat.name}</DataTableCell>
                  <DataTableCell>{mat.category}</DataTableCell>
                  <DataTableCell>{formatCurrencyPrecise(mat.cost)}</DataTableCell>
                  <DataTableCell>{mat.quantity} {mat.unit}</DataTableCell>
                  <DataTableCell>
                    <Badge variant={isLow ? 'warning' : 'success'}>
                      {isLow ? t.materials.lowStock : t.materials.inStock}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t.common.edit}
                        data-testid={`material-edit-${mat.id}`}
                        onClick={() => { setEditingMaterial(mat); setShowForm(true) }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t.materials.receiveStock}
                        data-testid={`material-receive-${mat.id}`}
                        onClick={() => setReceiveMaterialId(mat.id)}
                      >
                        <PackagePlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              )
            })}
          </DataTable>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.materials.recentTransactions}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm max-h-80 overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="text-muted-foreground">—</p>
            ) : (
              transactions.slice(0, 15).map((tx) => (
                <div key={tx.id} className="flex justify-between gap-2 border-b border-border/50 pb-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getMaterialName(tx.material_id)}</p>
                    <p className="text-xs text-muted-foreground">{tx.transaction_type}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={tx.quantity_change < 0 ? 'text-destructive' : 'text-success'}>
                      {tx.quantity_change > 0 ? '+' : ''}{tx.quantity_change}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.created_at, dateLocale)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {receiveMaterialId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReceiveMaterialId(null)}>
          <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()} data-testid="materials-receive-dialog">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t.materials.receiveStock}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setReceiveMaterialId(null)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm font-medium">{getMaterialName(receiveMaterialId)}</p>
              <div>
                <Label>{t.materials.qty}</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min={1}
                  value={receiveQty}
                  onChange={(e) => setReceiveQty(Number(e.target.value))}
                />
              </div>
              <Button className="w-full" onClick={() => handleReceive(receiveMaterialId)} disabled={receiveStock.isPending}
                data-testid="materials-receive-submit">
                {t.materials.receive}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
