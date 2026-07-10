import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { validatePortalToken, setPortalSession } from '@/services/portal-service'
import { useTranslation } from '@/contexts/locale-context'

export default function PortalAccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError(t.portalAccess.invalidLink)
      return
    }

    void (async () => {
      const session = await validatePortalToken(token)
      if (!session) {
        setError(t.portalAccess.expiredLink)
        return
      }

      setPortalSession(session)
      navigate(session.portalType === 'property' ? '/portal/property' : '/portal/customer', { replace: true })
    })()
  }, [searchParams, navigate, t.portalAccess.expiredLink, t.portalAccess.invalidLink])

  if (error) {
    return (
      <div className="gradient-bg safe-x min-h-[100dvh] flex items-center justify-center p-4">
        <div className="text-center safe-top safe-bottom">
          <p className="text-destructive mb-4">{error}</p>
          <a href="/login?portal=1" className="text-primary underline text-sm">
            {t.portalAccess.backToLogin}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="gradient-bg safe-x min-h-[100dvh] flex items-center justify-center">
      <div className="text-center safe-top safe-bottom">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-4 animate-pulse">
          <Zap className="h-6 w-6 text-primary-foreground" />
        </div>
        <p className="text-muted-foreground">{t.portalAccess.opening}</p>
      </div>
    </div>
  )
}
