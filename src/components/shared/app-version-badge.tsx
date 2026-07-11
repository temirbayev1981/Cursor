import { format } from 'date-fns'
import { ru, enUS } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { getAppBuildTime, getAppVersion } from '@/lib/app-version'
import { useTranslation } from '@/contexts/locale-context'

export function AppVersionBadge() {
  const { t, locale } = useTranslation()
  const version = getAppVersion()
  const buildTime = getAppBuildTime()
  const dateLocale = locale === 'ru' ? ru : enUS
  const buildLabel = buildTime
    ? format(new Date(buildTime), 'dd.MM.yyyy HH:mm', { locale: dateLocale })
    : null

  return (
    <div
      data-testid="app-version-badge"
      className="flex flex-col items-end gap-1 text-right"
      title={buildLabel ? `${t.dashboard.versionLabel} ${version} · ${t.dashboard.buildLabel} ${buildLabel}` : `${t.dashboard.versionLabel} ${version}`}
    >
      <Badge variant="outline" className="font-mono text-xs">
        {t.dashboard.versionLabel} {version}
      </Badge>
      {buildLabel && (
        <span className="text-[11px] text-muted-foreground">
          {t.dashboard.buildLabel} {buildLabel}
        </span>
      )}
    </div>
  )
}
