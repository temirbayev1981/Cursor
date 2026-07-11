import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { MarkdownContent, extractMarkdownHeadings } from '@/components/shared/markdown-content'
import { useTranslation } from '@/contexts/locale-context'
import type { Locale } from '@/contexts/locale-context'

function instructionsFileForLocale(locale: Locale): string {
  return locale === 'en' ? 'INSTRUCTIONS.en.md' : 'INSTRUCTIONS.md'
}

export default function InstructionsPage() {
  const { t, locale } = useTranslation()
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    const file = instructionsFileForLocale(locale)
    void fetch(`${import.meta.env.BASE_URL}${file}`)
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
  }, [locale])

  const headings = content ? extractMarkdownHeadings(content).filter((h) => h.level <= 3) : []

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

      <div className="mx-auto flex max-w-5xl flex-col gap-6 lg:flex-row">
        {headings.length > 0 && (
          <nav className="glass-card h-fit shrink-0 p-4 lg:sticky lg:top-20 lg:w-56" data-testid="instructions-toc">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t.instructions.toc}
            </p>
            <ul className="space-y-1 text-sm">
              {headings.map((heading) => (
                <li
                  key={heading.id}
                  className={heading.level === 1 ? '' : heading.level === 2 ? 'pl-2' : 'pl-4'}
                >
                  <a
                    href={`#${heading.id}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="glass-card min-w-0 flex-1 p-6">
          {error && (
            <p className="text-destructive">{t.instructions.loadError}</p>
          )}
          {!content && !error && (
            <p className="text-muted-foreground">{t.common.loading}</p>
          )}
          {content && (
            <article className="instructions-doc font-sans text-sm">
              <MarkdownContent source={content} />
            </article>
          )}
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            {t.instructions.hint}
          </div>
        </div>
      </div>
    </div>
  )
}
