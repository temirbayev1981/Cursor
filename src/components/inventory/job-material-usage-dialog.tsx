import { useState } from 'react'
import { Package, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMaterials, useInventoryTransactions } from '@/hooks/use-entities'
import { useTranslation } from '@/contexts/locale-context'
import { toast } from 'sonner'
import type { Job } from '@/types'

interface JobMaterialUsageDialogProps {
  job: Job
  companyId: string
}

export function JobMaterialUsageDialog({ job, companyId }: JobMaterialUsageDialogProps) {
  const { t } = useTranslation()
  const { data: materials = [] } = useMaterials()
  const recordUsage = useInventoryTransactions()
  const [open, setOpen] = useState(false)
  const [materialId, setMaterialId] = useState('')
  const [quantity, setQuantity] = useState(1)

  const handleSubmit = () => {
    if (!materialId || quantity <= 0) return
    recordUsage.mutate(
      { companyId, jobId: job.id, items: [{ materialId, quantity }] },
      {
        onSuccess: () => {
          toast.success(t.materials.deducted)
          setOpen(false)
          setMaterialId('')
          setQuantity(1)
        },
        onError: () => toast.error(t.materials.deductionFailed),
      }
    )
  }

  return (
    <>
      <Button variant="ghost" size="icon" title={t.materials.useOnJob} onClick={() => setOpen(true)}
        data-testid={`job-material-usage-${job.id}`}>
        <Package className="h-4 w-4" />
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()} data-testid="job-material-dialog">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t.materials.useOnJob}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">{job.title}</p>
              <div>
                <Label>{t.materials.material}</Label>
                <Select value={materialId} onValueChange={setMaterialId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.quantity} {m.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t.materials.qty}</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={recordUsage.isPending || !materialId}
                data-testid="job-material-submit">
                {t.common.save}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
