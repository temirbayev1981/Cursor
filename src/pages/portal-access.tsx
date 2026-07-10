import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { validatePortalToken, setPortalSession } from '@/services/portal-service'
import { useTranslation } from '@/contexts/locale-context'

export default function PortalAccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { locale } = useTranslation()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError(locale === 'ru' ? 'Ссылка недействительна' : 'Invalid link')
      return
    }

    void (async () => {
      const session = await validatePortalToken(token)
      if (!session) {
        setError(locale === 'ru' ? 'Ссылка истекла или недействительна' : 'Link expired or invalid')
        return
      }

      setPortalSession(session)
      navigate(session.portalType === 'property' ? '/portal/property' : '/portal/customer', { replace: true })
    })()
  }, [searchParams, navigate, locale])

  if (error) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <a href="/login?portal=1" className="text-primary underline text-sm">
            {locale === 'ru' ? 'Вернуться ко входу' : 'Back to login'}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-4 animate-pulse">
          <Zap className="h-6 w-6 text-primary-foreground" />
        </div>
        <p className="text-muted-foreground">
          {locale === 'ru' ? 'Открываем портал…' : 'Opening portal…'}
        </p>
      </div>
    </div>
  )
}
