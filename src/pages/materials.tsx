import { Plus, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DEMO_MATERIALS } from '@/data/mock-data'
import { formatCurrencyPrecise } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'

export default function MaterialsPage() {
  const { t } = useTranslation()
  const lowStock = DEMO_MATERIALS.filter((m) => m.quantity <= m.reorder_level)

  return (
    <div>
      <PageHeader
        title={t.materials.title}
        description={t.materials.description}
        actions={<Button><Plus className="h-4 w-4" />{t.materials.addMaterial}</Button>}
      />

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
        {DEMO_MATERIALS.map((mat) => {
          const isLow = mat.quantity <= mat.reorder_level
          return (
            <DataTableRow key={mat.id}>
              <DataTableCell className="font-medium">{mat.name}</DataTableCell>
              <DataTableCell>{mat.category}</DataTableCell>
              <DataTableCell className="text-muted-foreground">{mat.supplier}</DataTableCell>
              <DataTableCell>{formatCurrencyPrecise(mat.cost)}</DataTableCell>
              <DataTableCell>{mat.markup_percent}%</DataTableCell>
              <DataTableCell className="font-medium">{formatCurrencyPrecise(mat.customer_price)}</DataTableCell>
              <DataTableCell>{mat.quantity} {mat.unit}</DataTableCell>
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
