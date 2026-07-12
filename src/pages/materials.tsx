import { useState } from 'react'
import { Plus, AlertTriangle, X, PackagePlus, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { TablePagination } from '@/components/shared/table-pagination'
import { TableSkeleton } from '@/components/shared/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MaterialForm } from '@/components/forms/material-form'
import { useAuth } from '@/contexts/auth-context'
import { useMaterialsSummary, useSaveMaterial, useInventoryTransactionsList, useReceiveStock } from '@/hooks/use-entities'
import { useServerEntityTable } from '@/hooks/use-server-entity-table'
import { formatCurrencyPrecise, formatDate } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'
import { useDateLocale } from '@/hooks/use-date-locale'
import { toast } from 'sonner'
import type { Material } from '@/types'

export default function MaterialsPage() {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { company } = useAuth()
  const companyId = company?.id ?? ''
  const [showForm, setShowForm] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [receiveMaterialId, setReceiveMaterialId] = useState<string | null>(null)
  const [receiveQty, setReceiveQty] = useState(10)
  const { isLoading: tableLoading, pagination } = useServerEntityTable('materials')
  const { data: materialsSummary, isLoading: summaryLoading } = useMaterialsSummary()
  const { data: transactions = [] } = useInventoryTransactionsList()
  const saveMaterial = useSaveMaterial()
  const receiveStock = useReceiveStock()
  const lowStock = materialsSummary?.lowStock ?? []
  const materialNames = materialsSummary?.names ?? {}

  const getMaterialName = (materialId: string) => materialNames[materialId] ?? materialId

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

  if (tableLoading || summaryLoading) return <TableSkeleton />

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
        <div className="lg:col-span-2 space-y-3">
          <div className="md:hidden space-y-3">
            {pagination.paginatedItems.map((mat) => {
              const isLow = mat.quantity <= mat.reorder_level
              return (
                <Card key={mat.id} className="p-4" data-testid={`material-card-${mat.id}`}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{mat.name}</p>
                      <Badge variant={isLow ? 'warning' : 'success'}>
                        {isLow ? t.materials.lowStock : t.materials.inStock}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                      <span className="text-muted-foreground">{t.materials.category}</span>
                      <span>{mat.category}</span>
                      <span className="text-muted-foreground">{t.materials.cost}</span>
                      <span>{formatCurrencyPrecise(mat.cost)}</span>
                      <span className="text-muted-foreground">{t.materials.qty}</span>
                      <span>{mat.quantity} {mat.unit}</span>
                    </div>
                    <div className="flex gap-1 pt-1">
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
                  </div>
                </Card>
              )
            })}
            <TablePagination pagination={pagination} testId="materials-pagination-mobile" />
          </div>

          <div className="hidden md:block">
          <DataTable
            headers={[t.materials.material, t.materials.category, t.materials.cost, t.materials.qty, t.materials.stockStatus, '']}
            pagination={pagination}
            paginationTestId="materials-pagination"
          >
            {pagination.paginatedItems.map((mat) => {
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
