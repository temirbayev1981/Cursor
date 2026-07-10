import { useState } from 'react'
import { PenLine, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/contexts/locale-context'
import type { Job } from '@/types'

interface JobNotesDialogProps {
  job: Job
  onSave: (job: Job, notes: string) => void
  isSaving?: boolean
}

export function JobNotesDialog({ job, onSave, isSaving }: JobNotesDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(job.description ?? '')

  const handleOpen = () => {
    setNotes(job.description ?? '')
    setOpen(true)
  }

  const handleSave = () => {
    onSave(job, notes)
    setOpen(false)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        <PenLine className="h-4 w-4" />{t.common.notes}
      </Button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`notes-title-${job.id}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle id={`notes-title-${job.id}`} className="text-base">{t.common.notes}</CardTitle>
              <Button variant="ghost" size="icon" aria-label={t.common.cancel} onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">{job.title}</p>
              <div>
                <Label htmlFor={`notes-${job.id}`}>{t.techMobile.jobNotes}</Label>
                <Textarea
                  id={`notes-${job.id}`}
                  className="mt-1"
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t.techMobile.jobNotesPlaceholder}
                />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                {t.common.save}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
