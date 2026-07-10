import { useState } from 'react'
import { Trash2, Eye, X } from 'lucide-react'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { VendorPORecord } from '@/types/vendor-po'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'

interface VendorPOTableProps {
  records: VendorPORecord[]
  onDelete?: (id: string) => void
  loading?: boolean
}

export function VendorPOTable({ records, onDelete, loading }: VendorPOTableProps) {
  const { t, locale } = useTranslation()
  const [selected, setSelected] = useState<VendorPORecord | null>(null)
  const dateLocale = locale === 'ru' ? 'ru-RU' : 'en-US'

  if (loading) {
    return (
      <div className="glass-card p-12 text-center text-muted-foreground">
        {t.common.loading}
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="glass-card p-12 text-center text-muted-foreground">
        {t.vendorPO.noRecords}
      </div>
    )
  }

  return (
    <>
      <DataTable
        headers={[
          t.vendorPO.vendorPoNumber,
          t.vendorPO.clientPoNumber,
          t.vendorPO.priority,
          t.vendorPO.orderType,
          t.vendorPO.nte,
          t.vendorPO.location,
          t.vendorPO.address,
          t.vendorPO.workScope,
          t.vendorPO.uploaded,
          '',
        ]}
        className="text-sm"
      >
        {records.map((row) => (
          <DataTableRow key={row.id}>
            <DataTableCell className="font-mono font-medium whitespace-nowrap">{row.vendor_po_number}</DataTableCell>
            <DataTableCell className="font-mono text-muted-foreground">{row.client_po_number}</DataTableCell>
            <DataTableCell>
              <Badge variant={row.priority.includes('EMERGENCY') || row.priority.includes('URGENT') ? 'destructive' : row.priority.startsWith('P1') || row.priority.startsWith('P2') ? 'warning' : 'outline'}>
                {row.priority}
              </Badge>
            </DataTableCell>
            <DataTableCell>{row.order_type}</DataTableCell>
            <DataTableCell className="font-medium">{formatCurrency(row.nte_amount)}</DataTableCell>
            <DataTableCell>
              <div>
                <p className="font-medium">{row.service_location_name}</p>
                {row.location_number && <p className="text-xs text-muted-foreground">Loc #{row.location_number}</p>}
              </div>
            </DataTableCell>
            <DataTableCell>
              <div className="max-w-[200px]">
                <p>{row.service_address}</p>
                <p className="text-xs text-muted-foreground">{row.service_city}, {row.service_state} {row.service_zip}</p>
              </div>
            </DataTableCell>
            <DataTableCell>
              <p className="max-w-[240px] truncate" title={row.work_summary}>{row.work_summary}</p>
            </DataTableCell>
            <DataTableCell className="text-muted-foreground whitespace-nowrap">
              {formatDate(row.created_at, dateLocale)}
            </DataTableCell>
            <DataTableCell>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(row)}>
                  <Eye className="h-4 w-4" />
                </Button>
                {onDelete && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(row.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTable>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{t.vendorPO.details} — {selected.vendor_po_number}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{selected.source_file_name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Detail label={t.vendorPO.clientPoNumber} value={selected.client_po_number} />
              <Detail label={t.vendorPO.priority} value={selected.priority} />
              <Detail label={t.vendorPO.orderType} value={selected.order_type} />
              <Detail label={t.vendorPO.nte} value={formatCurrency(selected.nte_amount)} />
              <Detail label={t.vendorPO.clientCompany} value={selected.client_company} />
              <Detail label={t.vendorPO.clientContact} value={selected.client_contact} />
              <Detail label={t.vendorPO.clientPhone} value={selected.client_phone} />
              <Detail label={t.vendorPO.clientEmail} value={selected.client_email} />
              <Detail label={t.vendorPO.location} value={`${selected.service_location_name} #${selected.location_number ?? ''}`} className="col-span-2" />
              <Detail label={t.vendorPO.address} value={`${selected.service_address}, ${selected.service_city}, ${selected.service_state} ${selected.service_zip}`} className="col-span-2" />
              <Detail label={t.vendorPO.servicePhone} value={selected.service_phone} />
              <Detail label={t.vendorPO.vendorName} value={`${selected.vendor_name} (#${selected.vendor_number})`} />
              <Detail label={t.vendorPO.workScope} value={selected.work_summary} className="col-span-2" />
              <Detail label={t.vendorPO.fullDescription} value={selected.service_description} className="col-span-2" />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

function Detail({ label, value, className }: { label: string; value?: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="font-medium">{value || '—'}</p>
    </div>
  )
}
