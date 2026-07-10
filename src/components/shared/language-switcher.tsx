import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocale, type Locale } from '@/contexts/locale-context'
import { cn } from '@/lib/utils'

interface LanguageSwitcherProps {
  compact?: boolean
  className?: string
}

export function LanguageSwitcher({ compact = false, className }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale()

  const toggle = () => setLocale(locale === 'ru' ? 'en' : 'ru')

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggle}
        className={cn('gap-1.5 text-xs font-medium px-2', className)}
        title={locale === 'ru' ? 'Switch to English' : 'Переключить на русский'}
      >
        <Globe className="h-3.5 w-3.5" />
        {locale === 'ru' ? 'EN' : 'RU'}
      </Button>
    )
  }

  return (
    <div className={cn('inline-flex rounded-lg bg-secondary/50 p-0.5', className)}>
      {(['ru', 'en'] as Locale[]).map((lang) => (
        <button
          key={lang}
          onClick={() => setLocale(lang)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer',
            locale === lang
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {lang === 'ru' ? 'Русский' : 'English'}
        </button>
      ))}
    </div>
  )
}
