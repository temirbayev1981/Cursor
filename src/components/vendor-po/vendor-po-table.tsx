import { useEffect, useRef, useState } from 'react'
import { Trash2, Eye, X, Briefcase, Download, AlertTriangle, CheckSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { VendorPORecord } from '@/types/vendor-po'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'
import { useDateLocale } from '@/hooks/use-date-locale'
import { useWorkflow } from '@/contexts/workflow-context'
import { useQueryClient } from '@tanstack/react-query'
import { getErrorMessage } from '@/lib/error-message'
import { isJobCreateCustomerError } from '@/lib/job-create-errors'
import { useAuth } from '@/contexts/auth-context'
import { requireCompanyId } from '@/hooks/use-company-scope'
import { exportVendorPOsToExcel, groupVendorPOsByAddress } from '@/lib/export'
import {
  getProblemDescriptionCell,
  getProblemDescriptionEn,
  needsProblemDescriptionTranslation,
} from '@/lib/vendor-po-problem'
import { normalizeVendorPORecord } from '@/lib/vendor-po-record'
import { translateProblemDescriptionToRussian } from '@/lib/vendor-po-translate'
import { updateVendorPOProblemRu } from '@/services/vendor-po-service'
import { toast } from 'sonner'

interface VendorPOTableProps {
  records: VendorPORecord[]
  onDelete?: (id: string) => void
  loading?: boolean
}

export function VendorPOTable({ records, onDelete, loading }: VendorPOTableProps) {
  const { t } = useTranslation()
  const { runVendorPOWorkflow, isRunning } = useWorkflow()
  const { company, user, isAuthenticated, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<VendorPORecord | null>(null)
  const [cellHint, setCellHint] = useState<{ title: string; text: string } | null>(null)
  const [problemTranslations, setProblemTranslations] = useState<Record<string, string>>({})
  const [translatingProblemIds, setTranslatingProblemIds] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const row of records) {
      if (needsProblemDescriptionTranslation(row)) initial.add(row.id)
    }
    return initial
  })
  const attemptedProblemIds = useRef(new Set<string>())
  const [translationPass, setTranslationPass] = useState(0)
  const dateLocale = useDateLocale()

  useEffect(() => {
    setTranslatingProblemIds(() => {
      const next = new Set<string>()
      for (const row of records) {
        if (needsProblemDescriptionTranslation(row) && !problemTranslations[row.id]) {
          next.add(row.id)
        }
      }
      return next
    })
  }, [records, problemTranslations])

  useEffect(() => {
    if (authLoading || !isAuthenticated) return

    let cancelled = false
    void (async () => {
      for (const row of records) {
        if (cancelled || !needsProblemDescriptionTranslation(row) || attemptedProblemIds.current.has(row.id)) continue
        const en = getProblemDescriptionEn(row)
        attemptedProblemIds.current.add(row.id)
        setTranslatingProblemIds((prev) => new Set(prev).add(row.id))
        const ru = await translateProblemDescriptionToRussian(en)
        if (cancelled) return
        setTranslatingProblemIds((prev) => {
          const next = new Set(prev)
          next.delete(row.id)
          return next
        })
        if (!ru) {
          attemptedProblemIds.current.delete(row.id)
          continue
        }
        setProblemTranslations((prev) => ({ ...prev, [row.id]: ru }))
        try {
          await updateVendorPOProblemRu(row.id, ru)
          void queryClient.invalidateQueries({ queryKey: ['vendor-pos'] })
        } catch {
          // Local state still shows Russian
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [records, authLoading, isAuthenticated, queryClient, translationPass])

  useEffect(() => {
    if (authLoading || !isAuthenticated) return

    const timer = window.setInterval(() => {
      let hasPending = false
      for (const row of records) {
        if (needsProblemDescriptionTranslation(row) && !problemTranslations[row.id]) {
          attemptedProblemIds.current.delete(row.id)
          hasPending = true
        }
      }
      if (hasPending) setTranslationPass((pass) => pass + 1)
    }, 60_000)

    return () => window.clearInterval(timer)
  }, [records, authLoading, isAuthenticated, problemTranslations])

  const addressGroups = groupVendorPOsByAddress(records)
  const multiSiteAddresses = [...addressGroups.entries()].filter(([, v]) => v.length > 1)

  const handleCreateJob = async (po: VendorPORecord) => {
    try {
      const companyId = requireCompanyId(company?.id)
      const userId = user?.id ?? 'user-001'
      await runVendorPOWorkflow(normalizeVendorPORecord(po), companyId, userId)
      void queryClient.invalidateQueries({ queryKey: ['vendor-pos'] })
      toast.success(t.vendorPO.jobCreatedFrom.replace('{poNumber}', po.vendor_po_number))
      navigate('/jobs')
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Vendor PO create job failed:', message)
      toast.error(isJobCreateCustomerError(error)
        ? t.vendorPO.jobCreateNoCustomer
        : t.vendorPO.jobCreateFailed)
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

      <div className="md:hidden space-y-3">
        {records.map((rawRow) => {
          const row = normalizeVendorPORecord(rawRow)
          const priority = row.priority
          const isEmergency = priority.includes('EMERGENCY') || priority.startsWith('P1')
          const problemCell = getProblemDescriptionCell(row, {
            translated: problemTranslations[row.id],
            isTranslating: translatingProblemIds.has(row.id),
          })
          return (
            <Card
              key={row.id}
              className={cn('p-4', isEmergency && 'border-destructive/40 bg-destructive/5')}
              data-testid={`vendor-po-card-${row.id}`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono font-semibold">
                      {row.vendor_po_number}
                      {isEmergency && <AlertTriangle className="inline h-3.5 w-3.5 ml-1 text-destructive" />}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{row.client_po_number}</p>
                  </div>
                  <Badge variant={isEmergency ? 'destructive' : priority.includes('URGENT') ? 'warning' : 'outline'}>
                    {priority || '—'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                  <span className="text-muted-foreground">{t.vendorPO.orderType}</span>
                  <span>{row.order_type}</span>
                  <span className="text-muted-foreground">{t.vendorPO.nte}</span>
                  <span className="font-medium">
                    {formatCurrency(row.nte_amount)}
                    {row.nte_amount === 0 && <span className="text-xs text-warning ml-1">NTE↑</span>}
                  </span>
                  <span className="text-muted-foreground">{t.vendorPO.location}</span>
                  <span className="line-clamp-2 break-words">
                    {row.service_location_name}
                    {row.location_number ? ` — #${row.location_number}` : ''}
                  </span>
                  <span className="text-muted-foreground">{t.vendorPO.address}</span>
                  <span className="line-clamp-2 break-words">
                    {[row.service_address, row.service_city, row.service_state].filter(Boolean).join(', ') || '—'}
                  </span>
                </div>
                {problemCell.text ? (
                  <button
                    type="button"
                    className={cn(
                      'text-sm line-clamp-3 break-words text-left w-full',
                      problemCell.state === 'en' ? 'text-muted-foreground' : '',
                    )}
                    onClick={() => setCellHint({ title: t.vendorPO.problemDescription, text: problemCell.text })}
                    data-testid={`vendor-po-problem-${row.id}`}
                  >
                    {problemCell.text}
                  </button>
                ) : null}
                {row.work_summary ? (
                  <button
                    type="button"
                    className="text-sm line-clamp-2 break-words text-left w-full text-muted-foreground"
                    onClick={() => setCellHint({ title: t.vendorPO.workScope, text: row.work_summary || row.service_description })}
                    data-testid={`vendor-po-work-scope-${row.id}`}
                  >
                    {row.work_summary}
                  </button>
                ) : null}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">{formatDate(row.created_at, dateLocale)}</span>
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
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="hidden md:block">
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
        {records.map((rawRow) => {
          const row = normalizeVendorPORecord(rawRow)
          const priority = row.priority
          const isEmergency = priority.includes('EMERGENCY') || priority.startsWith('P1')
          const problemCell = getProblemDescriptionCell(row, {
            translated: problemTranslations[row.id],
            isTranslating: translatingProblemIds.has(row.id),
          })
          return (
            <DataTableRow key={row.id} className={isEmergency ? 'bg-destructive/5' : ''}>
              <DataTableCell className="font-mono font-medium whitespace-nowrap">
                {row.vendor_po_number}
                {isEmergency && <AlertTriangle className="inline h-3 w-3 ml-1 text-destructive" />}
              </DataTableCell>
              <DataTableCell className="font-mono text-muted-foreground">{row.client_po_number}</DataTableCell>
              <DataTableCell>
                <Badge variant={isEmergency ? 'destructive' : priority.includes('URGENT') ? 'warning' : 'outline'}>
                  {priority || '—'}
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
                {problemCell.text ? (
                  <button
                    type="button"
                    className={`line-clamp-2 leading-snug break-words text-left w-full cursor-pointer hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm${problemCell.state === 'en' ? ' text-muted-foreground' : ''}`}
                    onClick={() => setCellHint({ title: t.vendorPO.problemDescription, text: problemCell.text })}
                    data-testid={`vendor-po-problem-${row.id}`}
                    aria-label={t.vendorPO.problemDescription}
                  >
                    {problemCell.text}
                    {problemCell.isTranslating ? (
                      <span className="block text-xs italic mt-0.5">{t.vendorPO.problemDescriptionTranslating}</span>
                    ) : null}
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
      </div>

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
                  value={getProblemDescriptionCell(selected, {
                    translated: problemTranslations[selected.id],
                    isTranslating: translatingProblemIds.has(selected.id),
                  }).text || (translatingProblemIds.has(selected.id) ? t.vendorPO.problemDescriptionTranslating : undefined)}
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
