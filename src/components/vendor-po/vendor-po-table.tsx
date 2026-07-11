import { useEffect, useRef, useState } from 'react'
import { Trash2, Eye, X, Briefcase, Download, AlertTriangle, CheckSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { VendorPORecord } from '@/types/vendor-po'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'
import { useDateLocale } from '@/hooks/use-date-locale'
import { useWorkflow } from '@/contexts/workflow-context'
import { useAuth } from '@/contexts/auth-context'
import { requireCompanyId } from '@/hooks/use-company-scope'
import { exportVendorPOsToExcel, groupVendorPOsByAddress } from '@/lib/export'
import { getProblemDescriptionEn, getProblemDescriptionRu } from '@/lib/vendor-po-problem'
import { translateProblemDescriptionToRussian } from '@/lib/vendor-po-translate'
import { toast } from 'sonner'

interface VendorPOTableProps {
  records: VendorPORecord[]
  onDelete?: (id: string) => void
  loading?: boolean
}

export function VendorPOTable({ records, onDelete, loading }: VendorPOTableProps) {
  const { t } = useTranslation()
  const { runVendorPOWorkflow, isRunning } = useWorkflow()
  const { company, user } = useAuth()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<VendorPORecord | null>(null)
  const [cellHint, setCellHint] = useState<{ title: string; text: string } | null>(null)
  const [problemTranslations, setProblemTranslations] = useState<Record<string, string>>({})
  const attemptedProblemIds = useRef(new Set<string>())
  const dateLocale = useDateLocale()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      for (const row of records) {
        if (cancelled || row.problem_description_ru || attemptedProblemIds.current.has(row.id)) continue
        const en = getProblemDescriptionEn(row)
        if (!en || !/[a-z]/i.test(en)) continue
        attemptedProblemIds.current.add(row.id)
        const ru = await translateProblemDescriptionToRussian(en)
        if (cancelled || !ru) continue
        setProblemTranslations((prev) => ({ ...prev, [row.id]: ru }))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [records])

  const addressGroups = groupVendorPOsByAddress(records)
  const multiSiteAddresses = [...addressGroups.entries()].filter(([, v]) => v.length > 1)

  const handleCreateJob = async (po: VendorPORecord) => {
    try {
      const companyId = requireCompanyId(company?.id)
      const userId = user?.id ?? 'user-001'
      await runVendorPOWorkflow(po, companyId, userId)
      toast.success(t.vendorPO.jobCreatedFrom.replace('{poNumber}', po.vendor_po_number))
      navigate('/jobs')
    } catch {
      toast.error(t.vendorPO.jobCreateFailed)
    }
  }

  if (loading) {
    return <div className="glass-card p-12 text-center text-muted-foreground">{t.common.loading}</div>
  }

  if (records.length === 0) {
    return <div className="glass-card p-12 text-center text-muted-foreground">{t.vendorPO.noRecords}</div>
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-4">
        <Button variant="outline" size="sm" data-testid="vendor-po-export-excel" onClick={() => void exportVendorPOsToExcel(records)}>
          <Download className="h-4 w-4" />{t.common.exportCsv}
        </Button>
        {multiSiteAddresses.length > 0 && (
          <Badge variant="warning" className="py-1.5" data-testid="vendor-po-multi-site-badge">
            {t.vendorPO.multiSiteBadge.replace('{count}', String(multiSiteAddresses.length))}
          </Badge>
        )}
      </div>

      <DataTable
        headers={[
          t.vendorPO.vendorPoNumber, t.vendorPO.clientPoNumber, t.vendorPO.priority,
          t.vendorPO.orderType, t.vendorPO.nte, t.vendorPO.location, t.vendorPO.address,
          t.vendorPO.problemDescription, t.vendorPO.workScope, '', '',
        ]}
        columnClassNames={[
          'w-[5.5rem]',
          'w-[5.5rem]',
          'w-[5rem]',
          'w-[4.5rem]',
          'w-[5rem]',
          'w-[9.5rem]',
          'w-[10rem]',
          'w-[11rem]',
          'w-[10rem]',
          'w-[4.5rem]',
          'w-[6rem]',
        ]}
        className="text-sm"
      >
        {records.map((row) => {
          const isEmergency = row.priority.includes('EMERGENCY') || row.priority.startsWith('P1')
          const problemRu = getProblemDescriptionRu(row, problemTranslations[row.id])
          return (
            <DataTableRow key={row.id} className={isEmergency ? 'bg-destructive/5' : ''}>
              <DataTableCell className="font-mono font-medium whitespace-nowrap">
                {row.vendor_po_number}
                {isEmergency && <AlertTriangle className="inline h-3 w-3 ml-1 text-destructive" />}
              </DataTableCell>
              <DataTableCell className="font-mono text-muted-foreground">{row.client_po_number}</DataTableCell>
              <DataTableCell>
                <Badge variant={isEmergency ? 'destructive' : row.priority.includes('URGENT') ? 'warning' : 'outline'}>
                  {row.priority}
                </Badge>
              </DataTableCell>
              <DataTableCell>{row.order_type}</DataTableCell>
              <DataTableCell className="font-medium">
                {formatCurrency(row.nte_amount)}
                {row.nte_amount === 0 && <span className="text-xs text-warning ml-1">NTE↑</span>}
              </DataTableCell>
              <DataTableCell className="align-top">
                <p className="font-medium line-clamp-2 leading-snug break-words">
                  {row.service_location_name}
                  {row.location_number ? (
                    <span className="text-muted-foreground font-normal">{` — Loc #${row.location_number}`}</span>
                  ) : null}
                </p>
              </DataTableCell>
              <DataTableCell className="align-top">
                <p className="line-clamp-2 leading-snug break-words">
                  {[row.service_address, row.service_city, row.service_state].filter(Boolean).join(', ') || '—'}
                </p>
              </DataTableCell>
              <DataTableCell className="align-top">
                {problemRu ? (
                  <button
                    type="button"
                    className="line-clamp-2 leading-snug break-words text-left w-full cursor-pointer hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
                    onClick={() => setCellHint({ title: t.vendorPO.problemDescription, text: problemRu })}
                    data-testid={`vendor-po-problem-${row.id}`}
                    aria-label={t.vendorPO.problemDescription}
                  >
                    {problemRu}
                  </button>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </DataTableCell>
              <DataTableCell>
                <button
                  type="button"
                  className="line-clamp-2 leading-snug break-words text-left w-full cursor-pointer hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
                  onClick={() => setCellHint({ title: t.vendorPO.workScope, text: row.work_summary || row.service_description })}
                  data-testid={`vendor-po-work-scope-${row.id}`}
                  aria-label={t.vendorPO.workScope}
                >
                  {row.work_summary}
                </button>
              </DataTableCell>
              <DataTableCell className="text-muted-foreground whitespace-nowrap text-xs">
                {formatDate(row.created_at, dateLocale)}
              </DataTableCell>
              <DataTableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(row)} title={t.common.view}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" disabled={isRunning}
                    onClick={() => handleCreateJob(row)} title={t.vendorPO.createJob}
                    data-testid={`vendor-po-create-job-${row.id}`}>
                    <Briefcase className="h-4 w-4" />
                  </Button>
                  {onDelete && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(row.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </DataTableCell>
            </DataTableRow>
          )
        })}
      </DataTable>

      {cellHint && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
          onClick={() => setCellHint(null)}
          data-testid="vendor-po-cell-hint"
        >
          <Card
            className="w-full max-w-lg max-h-[70vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
              <CardTitle className="text-base">{cellHint.title}</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setCellHint(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{cellHint.text}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{t.vendorPO.details} — {selected.vendor_po_number}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{selected.source_file_name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Detail label={t.vendorPO.priority} value={selected.priority} />
                <Detail label={t.vendorPO.nte} value={formatCurrency(selected.nte_amount)} />
                <Detail label={t.vendorPO.location} value={`${selected.service_location_name} #${selected.location_number}`} className="col-span-2" />
                <Detail label={t.vendorPO.address} value={`${selected.service_address}, ${selected.service_city}, ${selected.service_state}`} className="col-span-2" />
                <Detail
                  label={t.vendorPO.problemDescription}
                  value={getProblemDescriptionRu(selected, problemTranslations[selected.id])}
                  className="col-span-2"
                />
                <Detail label={t.vendorPO.workScope} value={selected.work_summary} className="col-span-2" />
                <Detail label={t.vendorPO.fullDescription} value={selected.service_description} className="col-span-2" />
              </div>

              <div className="rounded-lg bg-secondary/30 p-4">
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <CheckSquare className="h-4 w-4" />{t.vendorPO.complianceChecklist}
                </h4>
                <ul className="space-y-1 text-sm">
                  {t.vendorPO.complianceItems.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <Button className="w-full" disabled={isRunning} onClick={() => handleCreateJob(selected)}>
                <Briefcase className="h-4 w-4" />{t.vendorPO.createJobAndEstimate}
              </Button>
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
