import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/contexts/locale-context'

export default function InstructionsPage() {
  const { t } = useTranslation()
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetch(`${import.meta.env.BASE_URL}INSTRUCTIONS.md`)
      .then((response) => {
        if (!response.ok) throw new Error('not found')
        return response.text()
      })
      .then((text) => {
        if (!cancelled) setContent(text)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="safe-x pb-8">
      <PageHeader
        title={t.instructions.title}
        description={t.instructions.description}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              {t.instructions.backToApp}
            </Link>
          </Button>
        }
      />

      <div className="glass-card mx-auto max-w-4xl p-6">
        {error && (
          <p className="text-destructive">{t.instructions.loadError}</p>
        )}
        {!content && !error && (
          <p className="text-muted-foreground">{t.common.loading}</p>
        )}
        {content && (
          <article className="instructions-doc whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
            {content}
          </article>
        )}
        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          {t.instructions.hint}
        </div>
      </div>
    </div>
  )
}
